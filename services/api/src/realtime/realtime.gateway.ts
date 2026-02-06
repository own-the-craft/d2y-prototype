import "dotenv/config";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeService } from "./realtime.service";
import { Server, Socket } from "socket.io";
import { Role } from "@prisma/client";
import { AuthUser } from "../common/types/auth-user";

function corsOrigin(): any {
  const v = process.env.CORS_ORIGINS?.trim();
  if (!v || v === "*" || v.toLowerCase() === "true") return "*";
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

@WebSocketGateway({
  cors: {
    origin: corsOrigin(),
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server!: Server;

  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    private realtime: RealtimeService,
  ) {}

  afterInit(server: Server) {
    this.realtime.setServer(server);
  }

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth as any)?.token ||
      (client.handshake.headers["authorization"]?.toString().startsWith("Bearer ")
        ? client.handshake.headers["authorization"]?.toString().slice(7)
        : undefined);

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwt.verify(token) as any;

      const user: AuthUser = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        name: payload.name,
        merchantId: payload.merchantId,
      };

      client.data.user = user;

      if (user.role === Role.ADMIN || user.role === Role.SUPPORT) {
        client.join("admin");
      }

      if (user.role === Role.MERCHANT && user.merchantId) {
        client.join(`merchant:${user.merchantId}`);
      }

      client.join(`user:${user.id}`);

      client.emit("connected", { ok: true, user });
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage("order.subscribe")
  async subscribeOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { orderId: string },
  ) {
    const user = client.data.user as AuthUser | undefined;
    if (!user) return { ok: false, error: "unauthorized" };

    const order = await this.prisma.order.findUnique({
      where: { id: body.orderId },
      select: { id: true, consumerId: true, merchantId: true },
    });

    if (!order) return { ok: false, error: "not_found" };

    const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPPORT;
    const isConsumerOk = user.role === Role.CONSUMER && order.consumerId === user.id;
    const isMerchantOk = user.role === Role.MERCHANT && user.merchantId && order.merchantId === user.merchantId;

    if (!(isAdmin || isConsumerOk || isMerchantOk)) {
      return { ok: false, error: "forbidden" };
    }

    client.join(`order:${order.id}`);
    return { ok: true };
  }
}
