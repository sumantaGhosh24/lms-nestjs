import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Course } from 'src/course/entities/course.entity';

import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Lesson } from './entities/lesson.entity';
import { QueryLessonDto } from './dto/query-lesson.dto';

@Injectable()
export class LessonService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async create(courseId: string, dto: CreateLessonDto): Promise<Lesson> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const existingLesson = await this.lessonRepository.findOne({
      where: {
        courseId,
        order: dto.order,
      },
    });

    if (existingLesson) {
      throw new ConflictException(
        `Lesson order ${dto.order} already exists in this course`,
      );
    }

    const lesson = this.lessonRepository.create({
      ...dto,
      courseId,
    });

    return this.lessonRepository.save(lesson);
  }

  async findAll(courseId: string, query: QueryLessonDto) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const { search, isPublished, page = 1, limit = 10 } = query;

    const queryBuilder = this.lessonRepository
      .createQueryBuilder('lesson')
      .where('lesson.course_id = :courseId', {
        courseId,
      });

    if (search) {
      queryBuilder.andWhere(
        `(
          lesson.title ILIKE :search
          OR lesson.description ILIKE :search
        )`,
        {
          search: `%${search}%`,
        },
      );
    }

    if (typeof isPublished === 'boolean') {
      queryBuilder.andWhere('lesson.is_published = :isPublished', {
        isPublished,
      });
    }

    queryBuilder
      .orderBy('lesson.order', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [lessons, total] = await queryBuilder.getManyAndCount();

    return {
      data: lessons,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id },
      relations: {
        course: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  async update(id: string, dto: UpdateLessonDto): Promise<Lesson> {
    const lesson = await this.findOne(id);

    if (dto.order !== undefined && dto.order !== lesson.order) {
      const existingLesson = await this.lessonRepository.findOne({
        where: {
          courseId: lesson.courseId,
          order: dto.order,
        },
      });

      if (existingLesson && existingLesson.id !== lesson.id) {
        throw new ConflictException(
          `Lesson order ${dto.order} already exists in this course`,
        );
      }
    }

    Object.assign(lesson, dto);

    return this.lessonRepository.save(lesson);
  }

  async remove(id: string): Promise<void> {
    const lesson = await this.findOne(id);

    await this.lessonRepository.remove(lesson);
  }

  async publish(id: string): Promise<Lesson> {
    const lesson = await this.findOne(id);

    lesson.isPublished = true;

    return this.lessonRepository.save(lesson);
  }

  async unpublish(id: string): Promise<Lesson> {
    const lesson = await this.findOne(id);

    lesson.isPublished = false;

    return this.lessonRepository.save(lesson);
  }

  async reorder(id: string, newOrder: number): Promise<Lesson> {
    if (newOrder < 1) {
      throw new BadRequestException('Lesson order must be greater than 0');
    }

    const lesson = await this.findOne(id);

    const targetLesson = await this.lessonRepository.findOne({
      where: {
        courseId: lesson.courseId,
        order: newOrder,
      },
    });

    if (targetLesson) {
      targetLesson.order = lesson.order;
      await this.lessonRepository.save(targetLesson);
    }

    lesson.order = newOrder;

    return this.lessonRepository.save(lesson);
  }
}
