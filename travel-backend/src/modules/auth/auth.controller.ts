import { Body, Controller, Get, Patch, Post, Delete, Res, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService, private readonly configService: ConfigService) { }


    @Post('register')
    register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response,) {
        return this.authService.register(dto, res);
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    googleLogin() {
        // Passport sẽ tự redirect sang Google
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleCallback(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const loginResponse = await this.authService.loginWithGoogle(req.user as any, res);

        const frontendUrl =
            this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

        return res.redirect(
            `${frontendUrl}/auth/google/callback?token=${loginResponse.accessToken}`,
        );
    }

    @Post('login')
    login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response,) {
        return this.authService.login(dto, res);
    }

    @Post('refresh')
    refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const refreshToken = req.cookies?.refreshToken;
        return this.authService.refreshToken(refreshToken, res);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    logout(
        @CurrentUser()
        user: {
            userId: string;
            email: string;
            name: string;
            roles: string[];
            permissions: string[];
        },
        @Res({ passthrough: true }) res: Response,
    ) {
        return this.authService.logout(user, res);
    }


    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(
        @CurrentUser()
        user: {
            userId: string;
            email: string;
            name: string;
            roles: string[];
            permissions: string[]
        }) {
        return this.authService.me(user);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me')
    updateMe(
        @CurrentUser()
        user: {
            userId: string;
            email: string;
            name: string;
            roles: string[];
            permissions: string[];
        },
        @Body() dto: UpdateUserDto,
    ) {
        return this.authService.updateMe(user, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me/avatar')
    @UseInterceptors(FileInterceptor('avatar'))
    updateMyAvatar(
        @CurrentUser()
        user: {
            userId: string;
            email: string;
            name: string;
            roles: string[];
            permissions: string[];
        },
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.authService.updateMyAvatar(user, file);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('me/avatar')
    removeMyAvatar(
        @CurrentUser()
        user: {
            userId: string;
            email: string;
            name: string;
            roles: string[];
            permissions: string[];
        },
    ) {
        return this.authService.removeMyAvatar(user);
    }
}