import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { DrizzleQueryError } from 'drizzle-orm/errors';
import { CreatedUser, UsersRepository } from '../../users/users.repository';
import { RegisterDto } from '../auth.dto';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<Pick<UsersRepository, 'create'>>;

  const dto: RegisterDto = {
    email: '  USER@example.com  ',
    password: 'password123',
    fullName: '  Nguyen Van A  ',
    phone: '  0901234567  ',
  };

  beforeEach(() => {
    usersRepository = {
      create: jest.fn(),
    };
    service = new AuthService(
      usersRepository as unknown as UsersRepository,
      {
        signAsync: jest.fn(),
      } as unknown as JwtService,
    );
  });
  describe('registerUser', () => {
    it('hashes the password, normalizes input, and returns a safe user', async () => {
      const createdUser: CreatedUser = {
        id: '7d8e809c-ea62-4e12-a8c7-c71b78ed79da',
        email: 'user@example.com',
        fullName: 'Nguyen Van A',
        phone: '0901234567',
        createdAt: new Date('2026-07-14T08:00:00.000Z'),
      };
      usersRepository.create.mockResolvedValue(createdUser);

      const result = await service.registerUser(dto);

      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      const input = usersRepository.create.mock.calls[0][0];
      expect(input).toMatchObject({
        email: 'user@example.com',
        fullName: 'Nguyen Van A',
        phone: '0901234567',
      });
      expect(input.passwordHash).not.toBe(dto.password);
      await expect(
        argon2.verify(input.passwordHash, dto.password),
      ).resolves.toBe(true);
      expect(result).toEqual(createdUser);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('translates a unique constraint violation into ConflictException', async () => {
      const cause = Object.assign(new Error('duplicate key'), {
        code: '23505',
      });
      usersRepository.create.mockRejectedValue(
        new DrizzleQueryError('insert into users', [], cause),
      );

      await expect(service.registerUser(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rethrows unexpected repository errors', async () => {
      const error = new Error('database unavailable');
      usersRepository.create.mockRejectedValue(error);

      await expect(service.registerUser(dto)).rejects.toBe(error);
    });
  });

  describe('login', () => {
    const user = {
      id: '7d8e809c-ea62-4e12-a8c7-c71b78ed79da',
      email: 'user@example.com',
      passwordHash: '',
    };

    let loginService: AuthService;
    let findByEmailWithPassword: jest.Mock;
    let signAsync: jest.MockedFunction<JwtService['signAsync']>;

    beforeEach(async () => {
      findByEmailWithPassword = jest.fn();
      signAsync = jest.fn();

      loginService = new AuthService(
        {
          findByEmailWithPassword,
        } as unknown as UsersRepository,
        {
          signAsync,
        } as unknown as JwtService,
      );

      user.passwordHash = await argon2.hash('password123', {
        type: argon2.argon2id,
      });
    });

    it('returns an access token for valid credentials', async () => {
      findByEmailWithPassword.mockResolvedValue(user);
      signAsync.mockResolvedValue('signed-jwt');

      const result = await loginService.login({
        email: '  USER@example.com  ',
        password: 'password123',
      });

      expect(findByEmailWithPassword).toHaveBeenCalledWith('user@example.com');
      expect(signAsync).toHaveBeenCalledWith({
        sub: user.id,
      });
      expect(result).toEqual({
        accessToken: 'signed-jwt',
      });
    });

    it('throws UnauthorizedException when the email does not exist', async () => {
      findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        loginService.login({
          email: 'missing@example.com',
          password: 'password123',
        }),
      ).rejects.toMatchObject({
        constructor: UnauthorizedException,
        message: 'Invalid credentials',
      });

      expect(signAsync).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the password is incorrect', async () => {
      findByEmailWithPassword.mockResolvedValue(user);

      await expect(
        loginService.login({
          email: 'user@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toMatchObject({
        constructor: UnauthorizedException,
        message: 'Invalid credentials',
      });

      expect(signAsync).not.toHaveBeenCalled();
    });
  });
});
