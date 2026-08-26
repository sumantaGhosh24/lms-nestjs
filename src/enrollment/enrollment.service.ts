import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from 'src/user/entities/user.entity';
import { Course } from 'src/course/entities/course.entity';

import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment.dto';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async create(
    userId: string,
    createEnrollmentDto: CreateEnrollmentDto,
  ): Promise<Enrollment> {
    const { courseId } = createEnrollmentDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const course = await this.courseRepository.findOne({
      where: {
        id: courseId,
        isPublished: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found or not published');
    }

    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: {
        userId,
        courseId,
      },
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === EnrollmentStatus.CANCELLED) {
        existingEnrollment.status = EnrollmentStatus.ACTIVE;
        existingEnrollment.enrolledAt = new Date();
        existingEnrollment.completedAt = null;

        return this.enrollmentRepository.save(existingEnrollment);
      }

      throw new ConflictException('You are already enrolled in this course');
    }

    const enrollment = this.enrollmentRepository.create({
      userId,
      courseId,
      status: EnrollmentStatus.ACTIVE,
      enrolledAt: new Date(),
    });

    return this.enrollmentRepository.save(enrollment);
  }

  async findById(enrollmentId: string, userId?: string): Promise<Enrollment> {
    const where: any = {
      id: enrollmentId,
    };

    if (userId) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.userId = userId;
    }

    const enrollment = await this.enrollmentRepository.findOne({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where,
      relations: {
        course: true,
        user: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return enrollment;
  }

  async findMyEnrollments(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [items, total] = await this.enrollmentRepository.findAndCount({
      where: {
        userId,
      },
      relations: {
        course: true,
      },
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: limit,
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        userId,
        courseId,
      },
      relations: {
        course: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('You are not enrolled in this course');
    }

    return enrollment;
  }

  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        userId,
        courseId,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    return !!enrollment;
  }

  async findCourseEnrollments(courseId: string, page = 1, limit = 10) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const skip = (page - 1) * limit;

    const [items, total] = await this.enrollmentRepository.findAndCount({
      where: {
        courseId,
      },
      relations: {
        user: true,
      },
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: limit,
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(
    enrollmentId: string,
    userId: string,
    updateDto: UpdateEnrollmentStatusDto,
  ): Promise<Enrollment> {
    const enrollment = await this.findById(enrollmentId, userId);

    if (enrollment.status === EnrollmentStatus.COMPLETED) {
      throw new BadRequestException('Completed enrollment cannot be changed');
    }

    if (updateDto.status === EnrollmentStatus.COMPLETED) {
      enrollment.completedAt = new Date();
    } else {
      enrollment.completedAt = null;
    }

    enrollment.status = updateDto.status;

    return this.enrollmentRepository.save(enrollment);
  }

  async complete(enrollmentId: string, userId: string): Promise<Enrollment> {
    const enrollment = await this.findById(enrollmentId, userId);

    if (enrollment.status === EnrollmentStatus.COMPLETED) {
      return enrollment;
    }

    if (enrollment.status === EnrollmentStatus.CANCELLED) {
      throw new BadRequestException('Cancelled enrollment cannot be completed');
    }

    enrollment.status = EnrollmentStatus.COMPLETED;
    enrollment.completedAt = new Date();

    return this.enrollmentRepository.save(enrollment);
  }

  async cancel(enrollmentId: string, userId: string): Promise<Enrollment> {
    const enrollment = await this.findById(enrollmentId, userId);

    if (enrollment.status === EnrollmentStatus.COMPLETED) {
      throw new BadRequestException('Completed enrollment cannot be cancelled');
    }

    enrollment.status = EnrollmentStatus.CANCELLED;
    enrollment.completedAt = null;

    return this.enrollmentRepository.save(enrollment);
  }

  async remove(enrollmentId: string, userId: string): Promise<void> {
    const enrollment = await this.findById(enrollmentId, userId);

    await this.enrollmentRepository.remove(enrollment);
  }
}
