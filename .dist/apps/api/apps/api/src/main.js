"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./modules/app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix("api");
    await app.listen(4000, "0.0.0.0");
    console.log("API server running on http://localhost:4000/api");
}
bootstrap().catch((error) => {
    console.error(error);
    process.exit(1);
});
