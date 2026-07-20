import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import configuration from './config/configuration';
import { DbModule } from './db/db.module';
import { HealthCheckModule } from './modules/health-check/health-check.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),

        JWT_SECRET: Joi.string().min(32).required(),
        JWT_EXPIRES_IN_SECONDS: Joi.number().integer().positive().default(900),
      }),
    }),
    DbModule,
    HealthCheckModule,
    AuthModule,
  ],
})
export class AppModule {}
