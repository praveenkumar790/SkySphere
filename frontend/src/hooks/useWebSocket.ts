import { useEffect, useState } from 'react';
import { getSocket } from '../services/websocket';

export interface Telemetry {
  executionId: string;
  currentWaypoint: number;
  totalWaypoints: number;
  progress: number;
  position: {
    lat: number;
    lng: number;
    altitude: number;
  };
  battery: number;
  speed: number;
  heading: number;
  eta: number;
}

export function useMissionMonitor(executionId: string | null) {
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Reset state when execution ID changes
    setTelemetry(null);
    setLastEvent(null);
    setConnected(false);

    if (!executionId) return;

    const socket = getSocket();

    const handleProgress = (data: Telemetry) => {
      setTelemetry(data);
    };

    const handleStarted = (data: any) => {
      console.log('Mission started:', data);
      setLastEvent({ type: 'mission:started', data });
    };

    const handleCompleted = (data: any) => {
      console.log('Mission completed:', data);
      setLastEvent({ type: 'mission:completed', data });
    };

    const handlePaused = (data: any) => {
      console.log('Mission paused:', data);
      setLastEvent({ type: 'mission:paused', data });
    };

    const handleResumed = (data: any) => {
      console.log('Mission resumed:', data);
      setLastEvent({ type: 'mission:resumed', data });
    };

    const handleAborted = (data: any) => {
      console.log('Mission aborted:', data);
      setLastEvent({ type: 'mission:aborted', data });
    };

    const handleConnect = () => {
      setConnected(true);
      socket.emit('subscribe:mission', { executionId });
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    // If already connected, subscribe immediately
    if (socket.connected) {
      setConnected(true);
      socket.emit('subscribe:mission', { executionId });
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('mission:progress', handleProgress);
    socket.on('mission:started', handleStarted);
    socket.on('mission:completed', handleCompleted);
    socket.on('mission:paused', handlePaused);
    socket.on('mission:resumed', handleResumed);
    socket.on('mission:aborted', handleAborted);

    return () => {
      if (executionId) {
        socket.emit('unsubscribe:mission', { executionId });
      }
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('mission:progress', handleProgress);
      socket.off('mission:started', handleStarted);
      socket.off('mission:completed', handleCompleted);
      socket.off('mission:paused', handlePaused);
      socket.off('mission:resumed', handleResumed);
      socket.off('mission:aborted', handleAborted);
    };
  }, [executionId]);

  const [lastEvent, setLastEvent] = useState<{ type: string; data: any } | null>(null);

  useEffect(() => {
    if (!executionId) return;
    const socket = getSocket();

    const handleEvent = (type: string) => (data: any) => {
      setLastEvent({ type, data });
    };

    socket.on('mission:started', handleEvent('mission:started'));
    socket.on('mission:completed', handleEvent('mission:completed'));
    socket.on('mission:paused', handleEvent('mission:paused'));
    socket.on('mission:resumed', handleEvent('mission:resumed'));
    socket.on('mission:aborted', handleEvent('mission:aborted'));

    return () => {
      socket.off('mission:started');
      socket.off('mission:completed');
      socket.off('mission:paused');
      socket.off('mission:resumed');
      socket.off('mission:aborted');
    };
  }, [executionId]);

  return { telemetry, connected, lastEvent };
}
