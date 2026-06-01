import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, ClerkId } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';

@Controller('api/users')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('onboard')
  async onboard(@ClerkId() clerkId: string, @CurrentUser() user: any, @Body() body: any) {
    const email = user?.email || body.email || null;
    const saved = await this.usersService.onboard(clerkId, email, body);
    return toUserResponse(saved);
  }

  @Get('me')
  me(@CurrentUser() user: any) {
    if (!user) throw new NotFoundException('User not found');
    return toUserResponse(user);
  }

  @Post('generate-link-code')
  @Roles(Role.STUDENT)
  async generateLinkCode(@ClerkId() clerkId: string) {
    const code = await this.usersService.generateParentLinkCode(clerkId);
    return { linkCode: code };
  }
}

function toUserResponse(user: any) {
  return {
    id: user.id,
    clerkId: user.clerkId,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    grade: user.grade,
    blocked: user.blocked,
    onboardingComplete: user.onboardingComplete,
  };
}
