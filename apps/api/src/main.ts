import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  await app.listen(4000, "0.0.0.0");
  console.log("API server running on http://localhost:4000/api");
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
