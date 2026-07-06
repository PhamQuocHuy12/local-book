import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckResponse,
  HealthCheckService,
} from './health-check.service';

@Controller('health')
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get()
  healthCheck(): Promise<HealthCheckResponse> {
    return this.healthCheckService.check();
  }
}
