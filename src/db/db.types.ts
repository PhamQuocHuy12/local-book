import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { relations } from './db.relations';

export type Database = NodePgDatabase<typeof relations>;
