import { Exclude } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { Course } from '../../course/entities/course.entity';
import { Enrollment } from '../../enrollment/entities/enrollment.entity';

export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  firstName!: string;

  @Column({ length: 100 })
  lastName!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Exclude()
  @Column({ length: 255 })
  password!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role!: UserRole;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isVerified!: boolean;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  verificationToken?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  verificationTokenExpiresAt?: Date | null;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  resetToken?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiresAt?: Date | null;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  refreshTokenHash?: string | null;

  @OneToMany(() => Course, (course) => course.createdBy)
  courses!: Course[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.user)
  enrollments!: Enrollment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
