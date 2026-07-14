import { ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { DrizzleQueryError } from 'drizzle-orm/errors';
import { CreatedUser, UsersRepository } from '../../users/users.repository';
import { RegisterDto } from '../auth.dto';
import { AuthService } from '../auth.service';

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
    service = new AuthService(usersRepository as unknown as UsersRepository);
  });

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
    await expect(argon2.verify(input.passwordHash, dto.password)).resolves.toBe(
      true,
    );
    expect(result).toEqual(createdUser);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('translates a unique constraint violation into ConflictException', async () => {
    const cause = Object.assign(new Error('duplicate key'), { code: '23505' });
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
