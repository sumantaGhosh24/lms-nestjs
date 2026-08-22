import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RegisterDto } from 'src/auth/dto/registerUser.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  async createUser(registerUserDto: RegisterDto) {
    try {
      const newUser = this.usersRepository.create(registerUserDto);

      return this.usersRepository.save(newUser);
    } catch (error: unknown) {
      console.log(error);

      const err = error as { code?: number };
      if (err.code) {
        throw new ConflictException('Email is already take.');
      }
    }
  }

  async getUserById(id: string) {}
}
