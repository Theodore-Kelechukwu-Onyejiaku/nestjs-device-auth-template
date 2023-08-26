import { Controller, Post, Req, Res, Body, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from "express";
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly AuthServiceX: AuthService,
    ) { }

    @Post("signup")
    async signup(
        @Req() req: Request,
        @Res() res: Response,
        @Body() body: { name: string, email: string, password: string }
    ) {
        let { name, email, password } = body
        let newUser = await this.AuthServiceX.signUp(name, email, password);
        res.status(newUser.statusCode).send(newUser);
    }

    @Post("signin")
    async signin(
        @Req() req: Request,
        @Res() res: Response,
        @Body() body: { email : string, password : string }
    ) {
        let { email, password } = body;
        let user = await this.AuthServiceX.signIn(email, password, req);
        console.log("The user", user)
        res.status(user.statusCode).send(user);
    }

    @UseGuards(AuthGuard)
    @Get("hello")
    async sayHello(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        let { statusCode, message } = await this.AuthServiceX.sayHello();
        res.status(statusCode).send(message)
    }

    @UseGuards(AuthGuard)
    @Get("signout")
    async signout(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        let { statusCode, message } = await this.AuthServiceX.signout(req);
        res.status(statusCode).send(message)
    }
}
