import "dotenv/config";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

function parseCorsOrigins(value?: string): boolean | string[] {
  if (!value) return true;
  const v = value.trim();
  if (v === "*" || v.toLowerCase() === "true") return true;
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: parseCorsOrigins(process.env.CORS_ORIGINS),
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("D2Y API")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger on http://localhost:${port}/docs`);
}

bootstrap();
