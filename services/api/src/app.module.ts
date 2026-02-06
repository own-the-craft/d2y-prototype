import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { CatalogModule } from "./catalog/catalog.module";
import { SlotsModule } from "./slots/slots.module";
import { RolesGuard } from "./common/guards/roles.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    RealtimeModule,
    CatalogModule,
    SlotsModule,
  ],
  controllers: [AppController],
  providers: [RolesGuard],
})
export class AppModule {}
