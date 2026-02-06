import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtModule, JwtModuleOptions } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => {
        const secret = config.get<string>("JWT_SECRET") ?? "dev-super-secret-change-me";
        const raw = config.get<string>("JWT_EXPIRES_IN") ?? "7d";

        // Prisma/Nest typings: accepteer number of "ms-style" string; cast is ok voor prototype
        const expiresIn = (/^\d+$/.test(raw) ? Number(raw) : raw) as any;

        return {
          secret,
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
