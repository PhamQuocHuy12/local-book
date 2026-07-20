import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController', () => {
  let app: INestApplication<Server>;
  let registerUser: jest.MockedFunction<AuthService['registerUser']>;
  let login: jest.MockedFunction<AuthService['login']>;

  beforeAll(async () => {
    registerUser = jest.fn();
    login = jest.fn();

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: { registerUser, login },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication<INestApplication<Server>>();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });
  describe('POST /v1/auth/register', () => {
    it('returns 201 and a safe response for valid registration data', async () => {
      registerUser.mockResolvedValue({
        id: '7d8e809c-ea62-4e12-a8c7-c71b78ed79da',
        email: 'user@example.com',
        fullName: 'Nguyen Van A',
        phone: null,
        createdAt: new Date('2026-07-14T08:00:00.000Z'),
      });

      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'password123',
          fullName: 'Nguyen Van A',
        })
        .expect(201);

      const responseBody: unknown = response.body;
      expect(responseBody).not.toHaveProperty('password');
      expect(responseBody).not.toHaveProperty('passwordHash');
      expect(registerUser).toHaveBeenCalledTimes(1);
    });

    it('rejects a caller-supplied role', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'password123',
          fullName: 'Nguyen Van A',
          role: 'owner',
        })
        .expect(400);

      expect(registerUser).not.toHaveBeenCalled();
    });

    it('rejects an invalid email and short password', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: 'short',
          fullName: 'Nguyen Van A',
        })
        .expect(400);

      expect(registerUser).not.toHaveBeenCalled();
    });

    it('trims registration fields before validation', async () => {
      registerUser.mockResolvedValue({
        id: '7d8e809c-ea62-4e12-a8c7-c71b78ed79da',
        email: 'user@example.com',
        fullName: 'Nguyen Van A',
        phone: '0901234567',
        createdAt: new Date('2026-07-14T08:00:00.000Z'),
      });

      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: '  user@example.com  ',
          password: 'password123',
          fullName: '  Nguyen Van A  ',
          phone: '  0901234567  ',
        })
        .expect(201);

      expect(registerUser).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
        fullName: 'Nguyen Van A',
        phone: '0901234567',
      });
    });

    it('rejects a whitespace-only full name', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'password123',
          fullName: '   ',
        })
        .expect(400);

      expect(registerUser).not.toHaveBeenCalled();
    });
  });

  describe('POST /v1/auth/login', () => {
    it('returns 200 and an access token for valid credentials', async () => {
      login.mockResolvedValue({ accessToken: 'signed-jwt' });

      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toEqual({ accessToken: 'signed-jwt' });
      expect(login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(login).toHaveBeenCalledTimes(1);
    });

    it('returns 401 when the service rejects invalid credentials', async () => {
      login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'wrong-password',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: 'Invalid credentials',
      });
      expect(login).toHaveBeenCalledTimes(1);
    });

    it('trims the email before passing credentials to the service', async () => {
      login.mockResolvedValue({ accessToken: 'signed-jwt' });

      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: '  user@example.com  ',
          password: 'password123',
        })
        .expect(200);

      expect(login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
    });

    it.each([
      {
        name: 'an invalid email',
        body: { email: 'not-an-email', password: 'password123' },
      },
      {
        name: 'a missing email',
        body: { password: 'password123' },
      },
      {
        name: 'a missing password',
        body: { email: 'user@example.com' },
      },
      {
        name: 'an empty password',
        body: { email: 'user@example.com', password: '' },
      },
    ])('returns 400 for $name', async ({ body }) => {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send(body)
        .expect(400);

      expect(login).not.toHaveBeenCalled();
    });

    it('rejects caller-supplied authorization claims', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
          role: 'owner',
        })
        .expect(400);

      expect(login).not.toHaveBeenCalled();
    });
  });
});
