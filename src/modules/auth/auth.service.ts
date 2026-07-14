import { ConflictException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { UsersRepository } from '../users/users.repository';
import { RegisterDto } from './auth.dto';
import { DrizzleQueryError } from 'drizzle-orm/errors';

@Injectable()
export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}

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
