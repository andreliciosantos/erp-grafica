import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WorkOrderStatusChangedPayload } from '@erp/shared-types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit() {
    this.logger.log('📡 Production WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to WebSocket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from WebSocket: ${client.id}`);
  }

  emitWorkOrderStatusChanged(payload: WorkOrderStatusChangedPayload) {
    this.logger.log(
      `🔔 Emitting work_order_status_changed: ${payload.orderNumber} -> ${payload.newStatus}`
    );
    this.server?.emit('work_order_status_changed', payload);
  }

  emitOrderReady(order: { id: string; orderNumber: string; customerName: string }) {
    this.logger.log(`🎉 Emitting order_ready_for_pickup: ${order.orderNumber}`);
    this.server?.emit('order_ready_for_pickup', order);
  }
}
