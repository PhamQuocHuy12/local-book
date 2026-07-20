import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { UsersRepository } from '../users/users.repository';
import { LoginDto, RegisterDto } from './auth.dto';
import { DrizzleQueryError } from 'drizzle-orm/errors';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(dto: RegisterDto) {
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    try {
      return await this.usersRepository.create({
        email: dto.email.trim().toLowerCase(),
        fullName: dto.fullName.trim(),
        phone: dto.phone?.trim() || null,
        passwordHash,
      });
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }
  }

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user =
      await this.usersRepository.findByEmailWithPassword(normalizedEmail);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
    });
    return { accessToken };
  }

  private isUniqueViolation(error: unknown): boolean {
    const databaseError =
      error instanceof DrizzleQueryError ? error.cause : error;

    return (
      databaseError instanceof Error &&
      'code' in databaseError &&
      databaseError.code === '23505'
    );
  }
}
