import {
  Controller,
  Get,
  Post,
  Query,
  RawBodyRequest,
  Req,
  Headers,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

@Controller('api/public')
export class WebhooksController {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  @Get('invites/validate')
  async validateInvite(@Query('token') token: string) {
    const invite = await this.prisma.teacherInvite.findFirst({
      where: { token, used: false },
    });

    if (!invite) {
      return { valid: false, reason: 'Token not found or already used' };
    }

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return { valid: false, reason: 'Token has expired' };
    }

    return { valid: true, email: invite.email || '' };
  }

  @Post('webhooks/clerk')
  async handleClerkWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const webhookSecret = this.config.get('CLERK_WEBHOOK_SECRET') || '';
    const rawBody = req.rawBody?.toString() || '';

    if (webhookSecret) {
      if (!svixId || !svixTimestamp || !svixSignature) {
        throw new HttpException('Missing signature headers', HttpStatus.UNAUTHORIZED);
      }

      if (!this.verifySignature(rawBody, svixId, svixTimestamp, svixSignature, webhookSecret)) {
        throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
      }
    }

    try {
      const event = JSON.parse(rawBody);
      const eventType = event.type;
      console.log('Clerk webhook received:', eventType);

      if (eventType === 'user.deleted') {
        const clerkId = event.data?.id;
        if (clerkId) {
          console.log('Processing user deletion for clerkId:', clerkId);
          await this.usersService.deleteUserByClerkId(clerkId);
        }
      }

      return 'OK';
    } catch (e) {
      console.error('Error processing webhook:', e.message);
      throw new HttpException('Error processing webhook', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private verifySignature(
    payload: string,
    svixId: string,
    svixTimestamp: string,
    svixSignature: string,
    secret: string,
  ): boolean {
    try {
      const rawSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
      const secretBytes = Buffer.from(rawSecret, 'base64');
      const signedContent = `${svixId}.${svixTimestamp}.${payload}`;

      const hash = crypto
        .createHmac('sha256', secretBytes)
        .update(signedContent)
        .digest('base64');

      const computed = `v1,${hash}`;
      return svixSignature.split(' ').some((sig) => sig === computed);
    } catch (e) {
      console.error('Signature verification error:', e.message);
      return false;
    }
  }
}
