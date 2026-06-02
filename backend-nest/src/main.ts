import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(helmet());

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const wwwFrontendUrl = frontendUrl.replace('https://', 'https://www.');

  app.enableCors({
    origin: [
      'http://localhost:3000',
      frontendUrl,
      wwwFrontendUrl,
    ],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Simple health check
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (req: any, res: any) => res.send({ status: 'ok' }));

  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`TutionSAAS backend running on port ${port}`);
}
bootstrap();
