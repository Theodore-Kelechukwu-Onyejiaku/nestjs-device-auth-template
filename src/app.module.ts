import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisCacheModule } from './providers/redis-cache/redis-cache.module';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import User from './entities/user';
import { AuthModule } from './modules/auth/auth.module';
config();

export const dbConfig: TypeOrmModuleOptions = {
  url: process.env.POSTGRES_URL,
  type: "postgres",
  entities: [User],
  synchronize: true
} as TypeOrmModuleOptions


@Module({
  imports: [
    TypeOrmModule.forRoot(dbConfig),
    RedisCacheModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }