import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export function setupWebSocket(io: SocketIOServer) {
  io.on('connection', (socket) => {
    console.log(`Socket ${socket.id} connected`);
    
    // Subscribe to mission updates
    socket.on('subscribe:mission', ({ executionId }: { executionId: string }) => {
      const room = `mission:${executionId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} subscribed to mission ${executionId}`);
    });
    
    // Unsubscribe from mission updates
    socket.on('unsubscribe:mission', ({ executionId }: { executionId: string }) => {
      const room = `mission:${executionId}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} unsubscribed from mission ${executionId}`);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Socket ${socket.id} disconnected`);
      // Socket.io automatically removes socket from all rooms on disconnect
    });
  });
}

// Broadcast function
export function broadcastProgress(
  io: SocketIOServer,
  executionId: string,
  data: any
) {
  const room = `mission:${executionId}`;
  io.to(room).emit('mission:progress', data);
}

export function broadcastMissionEvent(
  io: SocketIOServer,
  executionId: string,
  event: string,
  data: any
) {
  const room = `mission:${executionId}`;
  io.to(room).emit(event, data);
}
