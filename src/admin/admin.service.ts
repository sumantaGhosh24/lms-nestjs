import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Course } from 'src/course/entities/course.entity';
import {
  Enrollment,
  EnrollmentStatus,
} from 'src/enrollment/entities/enrollment.entity';
import { Lesson } from 'src/lesson/entities/lesson.entity';
import { User, UserRole } from 'src/user/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  async getDashboard() {
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalAdmins,
      totalCourses,
      publishedCourses,
      totalLessons,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      recentEnrollments,
      recentCourses,
      coursePerformance,
    ] = await Promise.all([
      this.userRepository.count(),

      this.userRepository.count({
        where: {
          role: UserRole.STUDENT,
        },
      }),

      this.userRepository.count({
        where: {
          role: UserRole.INSTRUCTOR,
        },
      }),

      this.userRepository.count({
        where: {
          role: UserRole.ADMIN,
        },
      }),

      this.courseRepository.count(),

      this.courseRepository.count({
        where: {
          isPublished: true,
        },
      }),

      this.lessonRepository.count(),

      this.enrollmentRepository.count(),

      this.enrollmentRepository.count({
        where: {
          status: EnrollmentStatus.ACTIVE,
        },
      }),

      this.enrollmentRepository.count({
        where: {
          status: EnrollmentStatus.COMPLETED,
        },
      }),

      this.getRecentEnrollments(),

      this.getRecentCourses(),

      this.getCoursePerformance(),
    ]);

    return {
      stats: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalAdmins,
        totalCourses,
        publishedCourses,
        draftCourses: totalCourses - publishedCourses,
        totalLessons,
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
      },
      recentEnrollments,
      recentCourses,
      coursePerformance,
    };
  }

  async getStats() {
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      publishedCourses,
      totalLessons,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
    ] = await Promise.all([
      this.userRepository.count(),

      this.userRepository.count({
        where: {
          role: UserRole.STUDENT,
        },
      }),

      this.userRepository.count({
        where: {
          role: UserRole.INSTRUCTOR,
        },
      }),

      this.courseRepository.count(),

      this.courseRepository.count({
        where: {
          isPublished: true,
        },
      }),

      this.lessonRepository.count(),

      this.enrollmentRepository.count(),

      this.enrollmentRepository.count({
        where: {
          status: EnrollmentStatus.ACTIVE,
        },
      }),

      this.enrollmentRepository.count({
        where: {
          status: EnrollmentStatus.COMPLETED,
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        students: totalStudents,
        instructors: totalInstructors,
      },
      courses: {
        total: totalCourses,
        published: publishedCourses,
        draft: totalCourses - publishedCourses,
      },
      lessons: totalLessons,
      enrollments: {
        total: totalEnrollments,
        active: activeEnrollments,
        completed: completedEnrollments,
      },
    };
  }

  private async getRecentEnrollments() {
    return this.enrollmentRepository.find({
      relations: {
        user: true,
        course: true,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 10,
    });
  }

  private async getRecentCourses() {
    return this.courseRepository.find({
      relations: {
        createdBy: true,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 10,
    });
  }

  private async getCoursePerformance() {
    return this.courseRepository
      .createQueryBuilder('course')
      .leftJoin('course.enrollments', 'enrollment')
      .select('course.id', 'id')
      .addSelect('course.title', 'title')
      .addSelect('COUNT(enrollment.id)', 'totalEnrollments')
      .addSelect(
        `COUNT(
          CASE
            WHEN enrollment.status = :completed
            THEN 1
          END
        )`,
        'completedEnrollments',
      )
      .setParameter('completed', EnrollmentStatus.COMPLETED)
      .groupBy('course.id')
      .addGroupBy('course.title')
      .orderBy('COUNT(enrollment.id)', 'DESC')
      .limit(10)
      .getRawMany();
  }
}
