import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { Course } from '../../course/entities/course.entity';

@Entity('lessons')
@Index(['courseId', 'order'])
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'course_id' })
  courseId!: string;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true })
  content!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnail!: string | null;

  @Column({ type: 'int', default: 0 })
  duration!: number;

  @Column({ type: 'int' })
  order!: number;

  @Column({ default: false })
  isPublished!: boolean;

  @ManyToOne(() => Course, (course) => course.lessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
