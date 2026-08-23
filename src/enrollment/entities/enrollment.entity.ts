import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';

import { Course } from '../../course/entities/course.entity';
import { User } from '../../user/entities/user.entity';

export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('enrollments')
@Unique(['userId', 'courseId'])
@Index(['userId'])
@Index(['courseId'])
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'course_id' })
  courseId!: string;

  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.ACTIVE,
  })
  status!: EnrollmentStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  enrolledAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @ManyToOne(() => User, (user) => user.enrollments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Course, (course) => course.enrollments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
