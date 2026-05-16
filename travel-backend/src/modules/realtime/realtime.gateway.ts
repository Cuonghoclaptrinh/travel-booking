import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: [process.env.FRONTEND_URL, 'http://localhost:5173'],
        credentials: true,
    },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    handleConnection(client: Socket) {
        console.log(`Socket connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Socket disconnected: ${client.id}`);
    }

    @SubscribeMessage('join_user_room')
    handleJoinUserRoom(
        @MessageBody() data: { userId: number },
        @ConnectedSocket() client: Socket,
    ) {
        console.log("USER JOIN ROOM", data);
        console.log("ROOM NAME", `user:${data.userId}`);
        const room = `user:${data.userId}`;
        client.join(room);
        return { joined: room };
    }

    @SubscribeMessage('join_admin_room')
    handleJoinAdminRoom(@ConnectedSocket() client: Socket) {
        client.join('admins');
        return { joined: 'admins' };
    }

    @SubscribeMessage('join_departure_room')
    handleJoinDepartureRoom(
        @MessageBody() data: { departureId: number },
        @ConnectedSocket() client: Socket,
    ) {
        const room = `departure:${data.departureId}`;
        client.join(room);
        return { joined: room };
    }

    emitBookingCreated(payload: any) {
        this.server.to('admins').emit('booking.created', payload);
    }

    emitBookingUpdatedToUser(userId: number, payload: any) {
        this.server.to(`user:${userId}`).emit('booking.updated', payload);
    }

    emitPaymentUpdatedToUser(userId: number, payload: any) {
        console.log("EMIT PAYMENT EVENT");
        console.log("TARGET ROOM", `user:${userId}`);
        console.log("PAYLOAD", payload);
        this.server.to(`user:${userId}`).emit('payment.updated', payload);
    }

    emitDepartureSlotsUpdated(departureId: number, payload: any) {
        this.server.to(`departure:${departureId}`).emit('departure.slots_updated', payload);
    }
}