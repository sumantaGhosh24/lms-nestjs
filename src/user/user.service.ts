import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';
import { UsersQueryDto } from './dto/user-query.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async findByVerificationToken(tokenHash: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { verificationToken: tokenHash },
    });
  }

  async findByResetToken(tokenHash: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { resetToken: tokenHash },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
    });
  }

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    verificationToken: string;
    verificationTokenExpiresAt: Date;
  }): Promise<User> {
    try {
      const newUser = this.usersRepository.create({
        ...data,
        email: data.email.toLowerCase().trim(),
      });
      return await this.usersRepository.save(newUser);
    } catch (error: unknown) {
      const code = (error as { code?: string | number }).code;
      if (code === '23505' || code === 23505) {
        throw new ConflictException('Email is already taken.');
      }
      throw error;
    }
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }

  async findAll(query: UsersQueryDto) {
    const { page = 1, limit = 20, search, role } = query;

    const qb = this.usersRepository.createQueryBuilder('user');

    if (search) {
      qb.andWhere(
        `
        (
          LOWER(user.firstName) LIKE LOWER(:search)
          OR LOWER(user.lastName) LIKE LOWER(:search)
          OR LOWER(user.email) LIKE LOWER(:search)
        )
        `,
        {
          search: `%${search}%`,
        },
      );
    }

    if (role) {
      qb.andWhere('user.role = :role', {
        role,
      });
    }

    qb.orderBy('user.createdAt', 'DESC');

    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [users, total] = await qb.getManyAndCount();

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async delete(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async getUser(id: string) {
    const user = await this.usersRepository.findOne({
      where: {
        id,
      },
      relations: {
        enrollments: {
          course: true,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserStatus(id: string, isActive: boolean) {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = isActive;

    return this.usersRepository.save(user);
  }

  async deleteUser(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.remove(user);

    return {
      message: 'User deleted successfully',
    };
  }
}
