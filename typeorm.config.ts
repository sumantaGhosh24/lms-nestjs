import 'dotenv/config';
import { DataSource } from 'typeorm';

import { User } from './src/user/entities/user.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'my_admin',
  password: process.env.DB_PASSWORD ?? 'my_admin',
  database: process.env.DB_DATABASE ?? 'lms',
  entities: [User],
  migrations: ['migrations/*.ts'],
  synchronize: false,
});
