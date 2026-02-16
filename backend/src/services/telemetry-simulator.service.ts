// AI-assisted: Generated initial simulator with Claude Code
// Manual improvements: Fixed timing bug (segment-based timing instead of total time)
import prisma from '../config/database';
import { broadcastProgress, broadcastMissionEvent } from '../config/websocket';
import { Server as SocketIOServer } from 'socket.io';
import {
  generateCrosshatchWaypoints,
  calculatePolygonArea,
  LatLng,
  Waypoint
} from '../services/waypoint-generator.service';

export interface Position {
  lat: number;
  lng: number;
  altitude: number;
}

interface SimulatorState {
  executionId: string;
  currentWaypointIndex: number;
  currentPosition: Position;
  startTime: number;
  segmentStartTime: number; // ⭐ CRITICAL: Time when current segment started
  pausedAt: number | null;
  totalPausedTime: number;
  battery: number;
  status: 'in-progress' | 'paused' | 'completed' | 'aborted';
  waypoints: Waypoint[];
  speed: number;
}

export class TelemetrySimulator {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private states: Map<string, SimulatorState> = new Map();
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  startSimulation(executionId: string, waypoints: Waypoint[], speed: number, initialBattery: number) {
    const state: SimulatorState = {
      executionId,
      currentWaypointIndex: 0,
      currentPosition: {
        lat: waypoints[0].latitude,
        lng: waypoints[0].longitude,
        altitude: waypoints[0].altitude
      },
      startTime: Date.now(),
      segmentStartTime: Date.now(),
      pausedAt: null,
      totalPausedTime: 0,
      battery: initialBattery,
      status: 'in-progress',
      waypoints,
      speed
    };

    this.states.set(executionId, state);

    const interval = setInterval(() => {
      this.updatePosition(executionId);
    }, 2000); // Update every 2 seconds

    this.intervals.set(executionId, interval);
  }

  private updatePosition(executionId: string) {
    const state = this.states.get(executionId);
    if (!state || state.status !== 'in-progress') return;

    const current = state.waypoints[state.currentWaypointIndex];
    const next = state.waypoints[state.currentWaypointIndex + 1];

    if (!next) {
      this.completeMission(executionId);
      return;
    }

    // Calculate distance for THIS segment only
    const distance = this.calculateDistance(current, next);
    const timeToNext = distance / state.speed; // seconds

    // ⭐ CRITICAL FIX: Use segment time, not total mission time
    const elapsedInSegment = (Date.now() - state.segmentStartTime) / 1000;
    const progress = Math.min(1, elapsedInSegment / timeToNext);

    const position = this.interpolatePosition(current, next, progress);

    // Calculate battery based on total flight time (excluding pauses)
    const totalFlightTime = (Date.now() - state.startTime - state.totalPausedTime) / 1000;
    const elapsedMinutes = totalFlightTime / 60;
    const battery = Math.max(0, state.battery - elapsedMinutes); // 1% per minute

    // Check if reached waypoint
    let currentSegmentProgress = progress;
    if (progress >= 1) {
      state.currentWaypointIndex++;
      state.currentPosition = {
        lat: next.latitude,
        lng: next.longitude,
        altitude: next.altitude
      };
      state.segmentStartTime = Date.now(); // ⭐ Reset timer for next segment

      // Update database
      this.updateExecutionProgress(executionId, state.currentWaypointIndex);

      // Reset progress for the NEW segment
      currentSegmentProgress = 0;
    } else {
      state.currentPosition = position;
    }

    // Calculate heading
    const heading = this.calculateHeading(current, next);

    // DEBUG LOG
    if (Math.random() < 0.05) {
      console.log(`[Telemetry] ExecID: ${executionId} | Heading: ${heading}`);
    }

    // Save telemetry to database with heading
    this.saveTelemetry(executionId, position, battery, state.speed, heading);

    // ... (rest of updatePosition)

    // ... (rest of updatePosition)


    // Broadcast via WebSocket
    const eta = this.calculateETA(state.waypoints, state.currentWaypointIndex, state.speed, currentSegmentProgress);

    // Log occasionally to debug ETA jumps
    if (Math.random() < 0.05) {
      console.log(`[Telemetry] ETA: ${eta}s, Index: ${state.currentWaypointIndex}, Progress: ${progress.toFixed(2)}`);
    }

    broadcastProgress(this.io, executionId, {
      currentWaypoint: state.currentWaypointIndex,
      totalWaypoints: state.waypoints.length,
      progress: (state.currentWaypointIndex / state.waypoints.length) * 100,
      position,
      battery,
      speed: state.speed,
      heading,
      eta
    });
  }

  private interpolatePosition(start: Waypoint, end: Waypoint, progress: number): Position {
    return {
      lat: start.latitude + (end.latitude - start.latitude) * progress,
      lng: start.longitude + (end.longitude - start.longitude) * progress,
      altitude: start.altitude + (end.altitude - start.altitude) * progress
    };
  }

  private calculateDistance(start: Waypoint, end: Waypoint): number {
    // Using Haversine formula (simplified for short distances)
    const R = 6371000; // Earth radius in meters
    const dLat = (end.latitude - start.latitude) * Math.PI / 180;
    const dLng = (end.longitude - start.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(start.latitude * Math.PI / 180) * Math.cos(end.latitude * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calculateHeading(start: Waypoint, end: Waypoint): number {
    const dLng = (end.longitude - start.longitude) * Math.PI / 180;
    const lat1 = start.latitude * Math.PI / 180;
    const lat2 = end.latitude * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }

  private calculateETA(waypoints: Waypoint[], currentIndex: number, speed: number, currentSegmentProgress: number = 0): number {
    let remainingDistance = 0;

    // 1. Calculate remaining distance in CURRENT segment
    if (currentIndex < waypoints.length - 1) {
      const currentSegmentDist = this.calculateDistance(waypoints[currentIndex], waypoints[currentIndex + 1]);
      const coveredInSegment = currentSegmentDist * Math.min(1, Math.max(0, currentSegmentProgress));
      remainingDistance += Math.max(0, currentSegmentDist - coveredInSegment);
    }

    // 2. Sum distance of all SUBSEQUENT segments
    for (let i = currentIndex + 1; i < waypoints.length - 1; i++) {
      remainingDistance += this.calculateDistance(waypoints[i], waypoints[i + 1]);
    }

    return Math.ceil(remainingDistance / speed); // seconds
  }

  private async updateExecutionProgress(executionId: string, waypointIndex: number) {
    const execution = await prisma.missionExecution.findUnique({
      where: { id: executionId },
      include: { mission: { include: { waypoints: true } } }
    });

    if (execution) {
      const totalWaypoints = execution.mission.waypoints.length;
      const progress = (waypointIndex / totalWaypoints) * 100;

      await prisma.missionExecution.update({
        where: { id: executionId },
        data: {
          currentWaypointIndex: waypointIndex,
          progressPercentage: progress
        }
      });
    }
  }

  private async saveTelemetry(executionId: string, position: Position, battery: number, speed: number, heading: number) {
    await prisma.telemetry.create({
      data: {
        executionId,
        latitude: position.lat,
        longitude: position.lng,
        altitude: position.altitude,
        batteryLevel: battery,
        speed,
        heading
      }
    });
  }

  pause(executionId: string) {
    const interval = this.intervals.get(executionId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(executionId);
    }
    const state = this.states.get(executionId);
    if (state && state.status === 'in-progress') {
      state.status = 'paused';
      state.pausedAt = Date.now();
    }
  }

  resume(executionId: string) {
    const state = this.states.get(executionId);
    if (state && state.status === 'paused') {
      const pauseDuration = Date.now() - state.pausedAt!;
      state.totalPausedTime += pauseDuration;
      state.status = 'in-progress';

      const interval = setInterval(() => {
        this.updatePosition(executionId);
      }, 2000);
      this.intervals.set(executionId, interval);
    }
  }

  abort(executionId: string) {
    const interval = this.intervals.get(executionId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(executionId);
    }
    const state = this.states.get(executionId);
    if (state) {
      state.status = 'aborted';
      prisma.missionExecution.update({
        where: { id: executionId },
        data: { status: 'aborted' }
      });

      broadcastMissionEvent(this.io, executionId, 'mission:aborted', {
        executionId,
        abortedAt: new Date().toISOString()
      });
    }
  }

  private async completeMission(executionId: string) {
    const interval = this.intervals.get(executionId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(executionId);
    }

    const state = this.states.get(executionId);
    if (state) {
      state.status = 'completed';

      // ⭐ Send FINAL progress update (100%)
      const finalPosition = {
        lat: state.waypoints[state.waypoints.length - 1].latitude,
        lng: state.waypoints[state.waypoints.length - 1].longitude,
        altitude: state.waypoints[state.waypoints.length - 1].altitude
      };

      broadcastProgress(this.io, executionId, {
        currentWaypoint: state.waypoints.length,
        totalWaypoints: state.waypoints.length,
        progress: 100,
        position: finalPosition,
        battery: state.battery,
        speed: state.speed,
        heading: 0,
        eta: 0
      });
    }

    const execution = await prisma.missionExecution.findUnique({
      where: { id: executionId },
      include: { mission: { include: { waypoints: true } }, telemetry: true }
    });

    if (execution) {
      // Calculate total distance and stats
      let totalDistance = 0;
      let maxSpeed = 0;
      let maxAltitude = 0;
      let startBattery = execution.telemetry[0]?.batteryLevel || 100;
      let endBattery = execution.telemetry[execution.telemetry.length - 1]?.batteryLevel || 0;

      for (let i = 0; i < execution.telemetry.length; i++) {
        const t = execution.telemetry[i];
        if (t.speed > maxSpeed) maxSpeed = t.speed;
        if (t.altitude > maxAltitude) maxAltitude = t.altitude;

        if (i < execution.telemetry.length - 1) {
          const t1 = execution.telemetry[i];
          const t2 = execution.telemetry[i + 1];
          const R = 6371000;
          const dLat = (t2.latitude - t1.latitude) * Math.PI / 180;
          const dLng = (t2.longitude - t1.longitude) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(t1.latitude * Math.PI / 180) * Math.cos(t2.latitude * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          totalDistance += R * c;
        }
      }

      const duration = Math.floor((Date.now() - execution.startedAt.getTime()) / 1000 / 60);

      // Calculate coverage area
      let coverageArea = 0;
      try {
        const polygon = execution.mission.polygonCoordinates as any as LatLng[]; // Cast JSON to LatLng[]
        console.log(`[Telemetry] CompleteMission ${executionId}. Polygon type: ${typeof polygon}, isArray: ${Array.isArray(polygon)}`);

        if (polygon && Array.isArray(polygon) && polygon.length >= 3) {
          console.log(`[Telemetry] Polygon has ${polygon.length} points. First: ${JSON.stringify(polygon[0])}`);
          const areaInSqMeters = calculatePolygonArea(polygon);
          console.log(`[Telemetry] Area (m2): ${areaInSqMeters}`);

          if (areaInSqMeters > 0) {
            coverageArea = Number((areaInSqMeters / 1000000).toFixed(4)); // Convert to km² and round
            console.log(`[Telemetry] Final Coverage Area (km2): ${coverageArea}`);
          } else {
            console.warn(`[Telemetry] Calculated area is 0!`);
          }
        } else {
          console.warn(`[Telemetry] Invalid polygon for area calculation:`, polygon);
        }
      } catch (error) {
        console.error('Failed to calculate coverage area:', error);
      }

      const batteryConsumed = Math.round(startBattery - endBattery);

      await prisma.missionExecution.update({
        where: { id: executionId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          progressPercentage: 100
        }
      });

      await prisma.surveyReport.create({
        data: {
          executionId,
          totalDistance: totalDistance / 1000, // Convert to km
          totalDuration: duration,
          coverageArea,
          waypointsCompleted: execution.mission.waypoints.length,
          maxSpeed,
          maxAltitude,
          batteryConsumed
        }
      });

      // Update drone status
      await prisma.drone.update({
        where: { id: execution.droneId },
        data: { status: 'available' }
      });

      broadcastMissionEvent(this.io, executionId, 'mission:completed', {
        executionId,
        completedAt: new Date().toISOString()
      });
    }
  }
}
