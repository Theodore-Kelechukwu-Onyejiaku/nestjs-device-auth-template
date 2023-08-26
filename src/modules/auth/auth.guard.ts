import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import * as DeviceDetector from "device-detector-js"
import { RedisCacheService } from "src/providers/redis-cache/redis-cache.service";

@Injectable()
export class AuthGuard implements CanActivate {
    private deviceDetector = new DeviceDetector();

    constructor(
        private jwtService: JwtService,
        private redisCacheService: RedisCacheService
    ) {

    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromBody(request);
        const clientDevice = this.getUserDevice(request);

        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const payload = await this.jwtService.verifyAsync(
                token
            );

            // add this to request object
            request['payload'] = payload

            // check if user is already logged in 
            let deviceToken = await this.redisCacheService.get(payload.email)
            deviceToken = await JSON.parse(deviceToken);

            if (deviceToken) {
                if (!(deviceToken.token === payload.email && deviceToken.device.client === clientDevice.client.name)) {
                    // user is not authorized
                    throw new HttpException("You are already logged in on another device", HttpStatus.UNAUTHORIZED)
                }
            } else {
                // cache user device
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
            }
        } catch (error) {
            throw new UnauthorizedException(error.message);
        }

        return true
    }

    private extractTokenFromBody(request: Request): string | undefined {
        const token = request.body["access-token"];
        return token;
    }

    private getUserDevice(request: Request) {
        const device = this.deviceDetector.parse(request.headers["user-agent"]);
        return device
    }
}