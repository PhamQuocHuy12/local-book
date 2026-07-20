import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { relations } from './db.relations';
import type { Database } from './db.types';

export const PG_POOL = Symbol('PG_POOL');
export const DB = Symbol('DB');

export const databaseProviders: Provider[] = [
  // POOL is used to create a connection pool to the PostgresSQL database and reuse the connection for multiple queries.
  // It is a best practice to use a connection pool instead of creating a new connection for each query.
  {
    provide: PG_POOL,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      return new Pool({
        connectionString: configService.getOrThrow<string>('database.url'),
      });
    },
  },
  {
    provide: DB,
    inject: [PG_POOL],
    useFactory: (pool: Pool): Database => {
      return drizzle({ client: pool, relations });
    },
  },
];
