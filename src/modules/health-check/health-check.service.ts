import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../db/db.provider';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
}

export interface HealthCheckResponse {
  app: HealthStatus;
  database: HealthStatus;
}

@Injectable()
export class HealthCheckService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async check(): Promise<HealthCheckResponse> {
    return {
      app: { status: 'healthy' },
      database: await this.checkDatabase(),
    };
  }

  private async checkDatabase(): Promise<HealthStatus> {
    try {
      await this.pool.query('select 1');
      return { status: 'healthy' };
    } catch {
      return { status: 'unhealthy' };
    }
  }
}
