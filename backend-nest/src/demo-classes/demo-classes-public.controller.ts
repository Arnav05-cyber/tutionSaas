import { Controller, Get } from '@nestjs/common';
import { DemoClassesService } from './demo-classes.service';

@Controller('api/public')
export class DemoClassesPublicController {
  constructor(private readonly demoClassesService: DemoClassesService) {}

  @Get('demo-class')
  getPublicDemoClass() {
    return this.demoClassesService.getPublicDemoClass();
  }
}
