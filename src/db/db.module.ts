import { Global, Module } from '@nestjs/common';
import { databaseProviders } from './db.provider';

@Global()
@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DbModule {}
