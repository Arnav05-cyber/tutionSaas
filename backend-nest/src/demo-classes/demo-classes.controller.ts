import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ClerkId } from '../common/decorators/current-user.decorator';
import { DemoClassesService } from './demo-classes.service';
import { CreateDemoClassDto } from './dto/create-demo-class.dto';
import { UpdateDemoClassDto } from './dto/update-demo-class.dto';

@Controller()
@UseGuards(ClerkAuthGuard, RolesGuard)
export class DemoClassesController {
  constructor(private readonly demoClassesService: DemoClassesService) {}

  // ─── Admin ────────────────────────────────────────────────────────────────

  @Get('api/admin/demo-classes/feature')
  @Roles(Role.ADMIN)
  async getFeatureStatus() {
    const enabled = await this.demoClassesService.isFeatureEnabled();
    return { enabled };
  }

  @Patch('api/admin/demo-classes/feature')
  @Roles(Role.ADMIN)
  setFeature(@Body() body: { enabled: boolean }) {
    return this.demoClassesService.setFeatureEnabled(body.enabled);
  }

  @Post('api/admin/demo-classes')
  @Roles(Role.ADMIN)
  createDemoClass(@Body() body: CreateDemoClassDto) {
    return this.demoClassesService.createDemoClass(body);
  }

  @Get('api/admin/demo-classes')
  @Roles(Role.ADMIN)
  getAllDemoClasses() {
    return this.demoClassesService.getAllDemoClasses();
  }

  @Put('api/admin/demo-classes/:id')
  @Roles(Role.ADMIN)
  updateDemoClass(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateDemoClassDto) {
    return this.demoClassesService.updateDemoClass(id, body);
  }

  @Patch('api/admin/demo-classes/:id/cancel')
  @Roles(Role.ADMIN)
  cancelDemoClass(@Param('id', ParseIntPipe) id: number) {
    return this.demoClassesService.cancelDemoClass(id);
  }

  @Patch('api/admin/demo-classes/:id/complete')
  @Roles(Role.ADMIN)
  completeDemoClass(@Param('id', ParseIntPipe) id: number) {
    return this.demoClassesService.completeDemoClass(id);
  }

  @Delete('api/admin/demo-classes/:id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDemoClass(@Param('id', ParseIntPipe) id: number) {
    await this.demoClassesService.deleteDemoClass(id);
  }

  // ─── Student ──────────────────────────────────────────────────────────────

  @Get('api/demo-classes/available')
  @Roles(Role.STUDENT)
  getAvailable(@ClerkId() clerkId: string) {
    return this.demoClassesService.getAvailableDemoClass(clerkId);
  }

  @Post('api/demo-classes/:id/join')
  @Roles(Role.STUDENT)
  joinDemoClass(
    @Param('id', ParseIntPipe) id: number,
    @ClerkId() clerkId: string,
  ) {
    return this.demoClassesService.joinDemoClass(id, clerkId);
  }

  // ─── Teacher ──────────────────────────────────────────────────────────────

  @Get('api/teacher/demo-classes')
  @Roles(Role.TEACHER)
  getTeacherDemoClasses(@ClerkId() clerkId: string) {
    return this.demoClassesService.getTeacherDemoClasses(clerkId);
  }

  @Get('api/teacher/demo-classes/:id')
  @Roles(Role.TEACHER, Role.ADMIN)
  getTeacherDemoClass(
    @Param('id', ParseIntPipe) id: number,
    @ClerkId() clerkId: string,
  ) {
    return this.demoClassesService.getDemoClassForTeacher(id, clerkId);
  }
}
