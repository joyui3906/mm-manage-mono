import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { type INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./modules/app.module";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const loadEnvFile = (filePath: string) => {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const index = trimmed.indexOf("=");
    if (index < 0) {
      return;
    }

    const key = trimmed.substring(0, index).trim();
    if (!key || process.env[key] !== undefined) {
      return;
    }

    let value = trimmed.substring(index + 1).trim();
    if (value.length >= 2 &&
        ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\'')))) {
      value = value.substring(1, value.length - 1);
    }

    process.env[key] = value;
  });
};

const initEnvironment = () => {
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "..", ".env"),
    resolve(process.cwd(), "../../.env"),
    resolve(dirname(process.cwd()), "..", ".env"),
  ];

  candidates.forEach(loadEnvFile);
};

const setupSwagger = (app: INestApplication) => {
  const swaggerEnabled = (process.env.MM_SWAGGER_ENABLED ?? "true").toLowerCase() !== "false";
  if (!swaggerEnabled) {
    return;
  }

  const swaggerPath = process.env.MM_SWAGGER_PATH || "docs";
  const swaggerTitle = process.env.MM_SWAGGER_TITLE || "MM Manage API";
  const swaggerDescription = process.env.MM_SWAGGER_DESCRIPTION || "API documentation for MM Manage";
  const swaggerVersion = process.env.MM_SWAGGER_VERSION || "1.0.0";

  const config = new DocumentBuilder()
    .setTitle(swaggerTitle)
    .setDescription(swaggerDescription)
    .setVersion(swaggerVersion)
    .addServer("http://localhost:4000")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(swaggerPath, app, document, {
    useGlobalPrefix: true,
    customSiteTitle: `${swaggerTitle} Docs`,
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const docsUrl = `http://localhost:4000/api/${swaggerPath}`;
  console.log(`Swagger docs: ${docsUrl}`);
};

async function bootstrap() {
  initEnvironment();

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new ApiExceptionFilter());

  setupSwagger(app);

  await app.listen(4000, "0.0.0.0");
  console.log("API server running on http://localhost:4000/api");
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
