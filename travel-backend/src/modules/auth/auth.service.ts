import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IsEmail } from 'class-validator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { use } from 'passport';
import { permission } from 'process';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Any } from 'typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        // private readonly userRepository: Repository<User>,
    ) { }

    private buildTokenPayload(user: any) {
        return {
            sub: user.id,
            email: user.email
        }
    }

    async register(registerDto: RegisterDto, res: Response) {
        const user = await this.userService.findByEmail(registerDto.email);
        if (user) {
            throw new BadRequestException("email đã tồn tại");
        }

        const createdUser = await this.userService.createUser(registerDto);

        return this.buildLoginResponse(createdUser, res);
    }

    async login(loginDto: LoginDto, res: Response) {
        const user = await this.userService.findByEmailWithPassword(loginDto.email);
        if (!user) {
            throw new BadRequestException("user hoặc mật khẩu không đúng");
        }
        if (!user.isActive) {
            throw new BadRequestException("tài khoản đã bị khoá");
        }

        if (!user.passwordHash) {
            throw new UnauthorizedException(
                'Tài khoản này được đăng ký bằng Google. Vui lòng đăng nhập bằng Google.',
            );
        }
        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            user.passwordHash
        )

        if (!isPasswordValid) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }
        return this.buildLoginResponse(user, res);
    }

    async logout(currentUser: {
        userId: string;
        email: string;
        name: string;
        roles: string[];
        permissions: string[];
    }, res: Response) {
        await this.userService.updateRefreshToken(currentUser.userId, null);
        this.clearRefreshTokenCookie(res);

        return {
            message: 'Đăng xuất thành công',
        };
    }

    private async buildLoginResponse(user: {
        id: string;
        name: string;
        email: string;
        phone?: string;
        avatarUrl?: string;
        isVerified: boolean;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, res: Response) {
        const accessToken = await this.generateAccessToken(user);
        const refreshToken = await this.generateRefreshToken(user);

        await this.userService.updateRefreshToken(user.id, refreshToken);
        this.setRefreshTokenCookie(res, refreshToken);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatarUrl: user.avatarUrl,
                isVerified: user.isVerified,
                isActive: user.isActive,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            accessToken,
        };
    }

    async me(currentUser: {
        userId: string;
        email: string;
        name: string;
        roles: string[];
        permissions: string[];
    }) {
        const user = await this.userService.findByEmail(currentUser.email);
        if (!user) {
            throw new UnauthorizedException('Không tìm thấy người dùng');
        }

        return {
            ...user,
            roles: currentUser.roles,
            permissions: currentUser.permissions
        };
    }

    async updateMe(
        currentUser: {
            userId: string;
            email: string;
            name: string;
            roles: string[];
            permissions: string[];
        },
        dto: UpdateUserDto,
    ) {
        const user = await this.userService.updateUser(currentUser.userId, dto);

        return {
            ...user,
            roles: currentUser.roles,
            permissions: currentUser.permissions,
        };
    }

    async updateMyAvatar(
        currentUser: {
            userId: string;
            email: string;
            name: string;
            roles: string[];
            permissions: string[];
        },
        file: Express.Multer.File,
    ) {
        const user = await this.userService.updateAvatar(currentUser.userId, file);

        return {
            ...user,
            roles: currentUser.roles,
            permissions: currentUser.permissions,
        };
    }

    async removeMyAvatar(
        currentUser: {
            userId: string;
            email: string;
            name: string;
            roles: string[];
            permissions: string[];
        },
    ) {
        const user = await this.userService.removeAvatar(currentUser.userId);

        return {
            ...user,
            roles: currentUser.roles,
            permissions: currentUser.permissions,
        };
    }

    private async generateAccessToken(user: { id: string; email: string }) {
        const expiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
        return this.jwtService.signAsync(
            {
                sub: user.id,
                email: user.email,
            },
            {
                secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
                expiresIn: expiresIn as any
            },
        );
    }

    private async generateRefreshToken(user: { id: string; email: string }) {
        const expiresIn = (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN')) || '7d'
        return this.jwtService.signAsync(
            {
                sub: user.id,
                email: user.email,
            },
            {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: expiresIn as any
            },
        );
    }

    private setRefreshTokenCookie(res: Response, refreshToken: string) {
        const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }

    private clearRefreshTokenCookie(res: Response) {
        const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            path: '/',
        });
    }

    async refreshToken(refreshToken: string, res: Response) {
        if (!refreshToken) {
            throw new UnauthorizedException('Không có refresh token');
        }

        let payload: { sub: string; email: string };

        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });
        } catch {
            throw new UnauthorizedException('Refresh token không hợp lệ');
        }

        const user = await this.userService.getUserWithRefreshToken(payload.sub);
        if (!user || !user.isActive || !user.refreshTokenHash) {
            throw new UnauthorizedException('Refresh token không hợp lệ');
        }

        const isRefreshTokenValid = await bcrypt.compare(
            refreshToken,
            user.refreshTokenHash,
        );

        if (!isRefreshTokenValid) {
            throw new UnauthorizedException('Refresh token không hợp lệ');
        }

        const newAccessToken = await this.generateAccessToken(user);
        const newRefreshToken = await this.generateRefreshToken(user);

        await this.userService.updateRefreshToken(user.id, newRefreshToken);
        this.setRefreshTokenCookie(res, newRefreshToken);

        return {
            accessToken: newAccessToken,
        };
    }

    async validateGoogleUser(payload: {
        googleId: string;
        email: string;
        name?: string;
        avatarUrl?: string;
    }) {
        const { googleId, email, name, avatarUrl } = payload;

        let user = await this.userService.findByGoogleIdOrEmail(googleId, email);

        if (!user) {
            user = await this.userService.createGoogleUser({
                googleId,
                email,
                name: name || email.split('@')[0],
                avatarUrl,
            });
        } else {
            let changed = false;

            if (!user.googleId) {
                user.googleId = googleId;
                changed = true;
            }

            if (!user.avatarUrl && avatarUrl) {
                user.avatarUrl = avatarUrl;
                changed = true;
            }

            if (!user.isVerified) {
                user.isVerified = true;
                changed = true;
            }

            if (changed) {
                user = await this.userService.saveUser(user);
            }
        }

        return user;
    }

    async loginWithGoogle(user: User, res: Response) {
        return this.buildLoginResponse(user, res);
    }
}
