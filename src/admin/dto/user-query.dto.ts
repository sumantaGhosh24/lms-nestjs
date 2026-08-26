import { IsEnum, IsOptional, IsString } from 'class-validator';

import { UserRole } from 'src/user/entities/user.entity';

import { AdminPaginationDto } from './admin-pagination.dto';

export class AdminUserQueryDto extends AdminPaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  status?: string;
}
