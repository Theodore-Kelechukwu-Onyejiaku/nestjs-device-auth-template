import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { RedisCacheModule } from 'src/providers/redis-cache/redis-cache.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import User from "../../entities/user"

@Module({
  imports: [
    JwtModule.register({
      secret: "skdf234w3mer",
      signOptions: { expiresIn: '5m' }
    }),
    RedisCacheModule,
    TypeOrmModule.forFeature([User])
  ],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule { }
