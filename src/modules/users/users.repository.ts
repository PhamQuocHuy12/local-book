import { Inject, Injectable } from '@nestjs/common';
import { DB } from '../../db/db.provider';
import { users } from '../../db/schema';
import type { Database } from '../../db/db.types';
import { eq } from 'drizzle-orm';

export type CreatedUserInput = Pick<
  typeof users.$inferInsert,
  'email' | 'phone' | 'passwordHash' | 'fullName'
>;

export type CreatedUser = Pick<
  typeof users.$inferSelect,
  'id' | 'email' | 'phone' | 'fullName' | 'createdAt'
>;

export type UserCredentials = Pick<
  typeof users.$inferSelect,
  'id' | 'email' | 'passwordHash'
>;

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(DB)
    private readonly db: Database,
  ) {}

  async create(input: CreatedUserInput): Promise<CreatedUser> {
    const [createdUser] = await this.db.insert(users).values(input).returning({
      id: users.id,
      email: users.email,
      phone: users.phone,
      fullName: users.fullName,
      createdAt: users.createdAt,
    });

    if (!createdUser) {
      throw new Error('User insert did not return a record');
    }

    return createdUser;
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<UserCredentials | null> {
    // V2 query builder syntax
    // const user = await this.db.query.users.findFirst({
    //   where: {
    //     email,
    //   },
    //   columns: {
    //     id: true,
    //     email: true,
    //     passwordHash: true,
    //   },
    // });

    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  }
}
