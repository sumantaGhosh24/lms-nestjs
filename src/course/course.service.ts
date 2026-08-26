import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import slugify from 'slugify';

import { User, UserRole } from 'src/user/entities/user.entity';
import { Enrollment } from 'src/enrollment/entities/enrollment.entity';

import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from './entities/course.entity';
import { QueryCourseDto } from './dto/query-course.dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private readonly enrollRepository: Repository<Enrollment>,
  ) {}

  async create(
    createCourseDto: CreateCourseDto,
    userId: string,
  ): Promise<Course> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const slug = await this.generateUniqueSlug(createCourseDto.title);

    const course = this.courseRepository.create({
      ...createCourseDto,
      slug,
      createdById: userId,
    });

    return this.courseRepository.save(course);
  }

  async findAll(query: QueryCourseDto) {
    const { search, isPublished, page = 1, limit = 10 } = query;

    const queryBuilder = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.createdBy', 'createdBy')
      .loadRelationIdAndMap('course.lessonCount', 'course.lessons')
      .loadRelationIdAndMap('course.enrollmentCount', 'course.enrollments');

    if (search) {
      queryBuilder.andWhere(
        '(course.title ILIKE :search OR course.description ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    if (isPublished !== undefined) {
      queryBuilder.andWhere('course.isPublished = :isPublished', {
        isPublished,
      });
    }

    queryBuilder
      .orderBy('course.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [courses, total] = await queryBuilder.getManyAndCount();

    return {
      data: courses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<Course> {
    return this.findCourseDetails({ column: 'id', value: id }, userId);
  }

  async findBySlug(slug: string, userId: string): Promise<Course> {
    return this.findCourseDetails({ column: 'slug', value: slug }, userId);
  }

  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
    userId: string,
  ): Promise<Course> {
    const course = await this.getCourseForManagement(id, userId);

    if (updateCourseDto.title && updateCourseDto.title !== course.title) {
      course.title = updateCourseDto.title;
      course.slug = await this.generateUniqueSlug(updateCourseDto.title);
    }

    Object.assign(course, {
      ...updateCourseDto,
      ...(updateCourseDto.title
        ? { title: updateCourseDto.title, slug: course.slug }
        : {}),
    });

    return this.courseRepository.save(course);
  }

  async remove(id: string, userId: string): Promise<void> {
    const course = await this.getCourseForManagement(id, userId);

    await this.courseRepository.remove(course);
  }

  async publish(id: string, userId: string): Promise<Course> {
    const course = await this.getCourseForManagement(id, userId);

    if (!course.lessons?.length) {
      throw new BadRequestException(
        'Course must have at least one lesson before publishing',
      );
    }

    course.isPublished = true;

    return this.courseRepository.save(course);
  }

  async unpublish(id: string, userId: string): Promise<Course> {
    const course = await this.getCourseForManagement(id, userId);

    course.isPublished = false;

    return this.courseRepository.save(course);
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = slugify(title, {
      lower: true,
      strict: true,
      trim: true,
    });

    let slug = baseSlug;
    let counter = 1;

    while (await this.courseRepository.exists({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private async getCourseForManagement(
    courseId: string,
    userId: string,
  ): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.ADMIN && course.createdById !== user.id) {
      throw new ForbiddenException('You are not allowed to manage this course');
    }

    return course;
  }

  private async findCourseDetails(
    condition: {
      column: 'id' | 'slug';
      value: string;
    },
    currentUserId: string,
  ): Promise<Course> {
    const user = await this.usersRepository.findOne({
      where: { id: currentUserId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const columnMap = {
      id: 'course.id',
      slug: 'course.slug',
    } as const;

    const column = columnMap[condition.column];

    const query = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.createdBy', 'createdBy')
      .where(`${column} = :value`, {
        value: condition.value,
      });

    if (user.role === UserRole.ADMIN || user.role === UserRole.INSTRUCTOR) {
      query
        .leftJoinAndSelect('course.lessons', 'lesson')
        .leftJoinAndSelect('course.enrollments', 'enrollment')
        .leftJoinAndSelect('enrollment.user', 'enrollmentUser')
        .addOrderBy('lesson.order', 'ASC');
    } else if (user.role === UserRole.STUDENT) {
      query
        .andWhere('course.isPublished = :isPublished', {
          isPublished: true,
        })
        .leftJoinAndSelect(
          'course.lessons',
          'lesson',
          'lesson.isPublished = :lessonPublished',
          {
            lessonPublished: true,
          },
        )
        .addOrderBy('lesson.order', 'ASC');
    }

    const course = await query.getOne();

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const enrollmentCount = await this.enrollRepository.count({
      where: {
        courseId: course.id,
      },
    });

    (course as Course & { enrollmentCount: number }).enrollmentCount =
      enrollmentCount;

    return course;
  }
}
