import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exception-filters';
import { IoAdapter } from '@nestjs/platform-socket.io';
import  helmet from 'helmet';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true
    }
  }));
  
  app.useGlobalFilters(new AllExceptionsFilter());
  
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "https://res.cloudinary.com"],
        connectSrc: ["'self'", "https://res.cloudinary.com"],
        fontSrc: ["'self'", "https:"],
        frameSrc: ["'self'", "https://res.cloudinary.com"], 
        mediaSrc: ["'self'", "https://res.cloudinary.com"]  
      },
  },
    crossOriginEmbedderPolicy: false
  }));


 app.enableCors({
  origin: process.env.FRONTEND_URL,  
  credentials: true,
  methods: ['GET', 'POST','PATCH','PUT','DELETE']
});
  app.useWebSocketAdapter(new IoAdapter(app))
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
