import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { CatalogModule } from "./catalog/catalog.module";
import { SlotsModule } from "./slots/slots.module";
import { OrdersModule } from "./orders/orders.module";
import { TicketsModule } from "./tickets/tickets.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    RealtimeModule,
    CatalogModule,
    SlotsModule,
    OrdersModule,
    TicketsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
