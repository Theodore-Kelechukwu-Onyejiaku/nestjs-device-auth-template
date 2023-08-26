import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from "@nestjs/jwt"
import { RedisCacheService } from 'src/providers/redis-cache/redis-cache.service';
import User from 'src/entities/user';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tuser } from './auth.dto';
import * as DeviceDetector from 'device-detector-js';

@Injectable()
export class AuthService {
    private deviceDetector = new DeviceDetector();

    constructor(
        private jwtService: JwtService,
        @InjectRepository(User) private UserRepo: Repository<User>,
        private redisCacheService: RedisCacheService
    ) { }

    async signUp(name, email, password) {
        const foundUser: Tuser = await this.UserRepo.findOne({
            where: { email }
        })
        if (foundUser) {
            throw new HttpException("user already exists", HttpStatus.BAD_REQUEST);
        }
        const newUser: Tuser = this.UserRepo.create({ name, email, password });
        await this.UserRepo.save(newUser);

        const payload = { id: newUser.id, name: newUser.name, email: newUser.email };

        return {
            access_token: await this.jwtService.signAsync(payload),
            statusCode: 200
        };
    }

    async signIn(email, password, req) {
        const foundUser: Tuser = await this.UserRepo.findOne({
            where: { email }
        })

        if (!foundUser) {
            throw new HttpException("User not registered", HttpStatus.BAD_REQUEST)
        }

        if (foundUser?.password !== password) {
            throw new HttpException("Email or password is incorrect!", HttpStatus.BAD_REQUEST)
        }
        const payload = { id: foundUser.id, name: foundUser.name, email: foundUser.email };

        try {
            // check if user is already signed in on another device
            const clientDevice = this.deviceDetector.parse(req.headers["user-agent"]);
            let deviceToken = await this.redisCacheService.get(payload.email)
            deviceToken = await JSON.parse(deviceToken);

            console.log("device token", deviceToken?.token)

            // if user is logged in on another device
            if (deviceToken && !(deviceToken.token === payload.email && deviceToken?.device?.client === clientDevice.client.name)) {
                throw new HttpException("You are already logged in on another device", HttpStatus.FORBIDDEN)
            } else {
                // cache user's device
                let emailKey = payload.email;
                let newDeviceToken = {
                    token: emailKey,
                    device: {
                        client: clientDevice.client.name,
                        type: clientDevice.client.type,
                        version: clientDevice.client.version
                    }
                }
                await this.redisCacheService.set(emailKey, JSON.stringify(newDeviceToken));

                return {
                    message: "Signin successful!",
                    access_token: await this.jwtService.signAsync(payload),
                    statusCode: 200
                };
            }
        } catch (error) {
            throw new UnauthorizedException(error.message);
        }
    }

    async signout(req) {
        const {email} = req.payload;
        await this.redisCacheService.del(email)
        return {
            message: "Signout successful",
            statusCode: 200
        }
    }

    async sayHello() {
        return {
            message: "Hello!",
            statusCode: 200
        }
    }
}
