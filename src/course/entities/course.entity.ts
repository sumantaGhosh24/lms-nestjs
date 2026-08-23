import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { User } from '../../user/entities/user.entity';
import { Lesson } from '../../lesson/entities/lesson.entity';
import { Enrollment } from '../../enrollment/entities/enrollment.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 200 })
  title!: string;

  @Index({ unique: true })
  @Column({ length: 250 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnail!: string | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  price!: number;

  @Column({ default: false })
  isPublished!: boolean;

  @Column({ name: 'created_by' })
  createdById!: string;

  @ManyToOne(() => User, (user) => user.courses, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'created_by' })
  createdBy!: User;

  @OneToMany(() => Lesson, (lesson) => lesson.course, {
    cascade: true,
  })
  lessons!: Lesson[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments!: Enrollment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
