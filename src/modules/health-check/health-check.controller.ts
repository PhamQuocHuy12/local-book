import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthCheckController {
  constructor() {}

  @Get()
  healthCheck(): string {
    return 'Healthy!';
  }
}
