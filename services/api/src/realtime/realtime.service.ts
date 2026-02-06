import { Injectable } from "@nestjs/common";
import type { Server } from "socket.io";

@Injectable()
export class RealtimeService {
  private server?: Server;

  setServer(server: Server) {
    this.server = server;
  }

  emitToRooms(rooms: string | string[], event: string, payload: any) {
    if (!this.server) return;
    (this.server as any).to(rooms).emit(event, payload);
  }

  emitAdmin(event: string, payload: any) {
    this.emitToRooms("admin", event, payload);
  }

  emitMerchant(merchantId: string, event: string, payload: any) {
    this.emitToRooms(`merchant:${merchantId}`, event, payload);
  }

  emitOrder(orderId: string, event: string, payload: any) {
    this.emitToRooms(`order:${orderId}`, event, payload);
  }
}
