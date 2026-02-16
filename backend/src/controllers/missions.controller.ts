import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import {
  generateCrosshatchWaypoints,
  generatePerimeterWaypoints,
  generateGridWaypoints,
  LatLng
} from '../services/waypoint-generator.service';
import { TelemetrySimulator } from '../services/telemetry-simulator.service';
import { Server as SocketIOServer } from 'socket.io';

let telemetrySimulator: TelemetrySimulator | null = null;

export function setTelemetrySimulator(io: SocketIOServer) {
  telemetrySimulator = new TelemetrySimulator(io);
}

export async function generateWaypoints(req: Request, res: Response, next: NextFunction) {
  try {
    const { polygon, pattern, altitude, overlap, speed, angle, distanceFromEdge, gridSize } = req.body;

    if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
      const error: AppError = new Error('Invalid polygon: must have at least 3 points');
      error.statusCode = 400;
      error.code = 'INVALID_POLYGON';
      return next(error);
    }

    let waypoints;

    switch (pattern) {
      case 'crosshatch':
        waypoints = generateCrosshatchWaypoints({ polygon, altitude, overlap, angle });
        break;
      case 'perimeter':
        if (!distanceFromEdge) {
          const error: AppError = new Error('distanceFromEdge is required for perimeter pattern');
          error.statusCode = 400;
          error.code = 'VALIDATION_ERROR';
          return next(error);
        }
        waypoints = generatePerimeterWaypoints({ polygon, altitude, distanceFromEdge });
        break;
      case 'grid':
        if (!gridSize) {
          const error: AppError = new Error('gridSize is required for grid pattern');
          error.statusCode = 400;
          error.code = 'VALIDATION_ERROR';
          return next(error);
        }
        waypoints = generateGridWaypoints({ polygon, altitude, gridSize });
        break;
      default:
        const error: AppError = new Error('Invalid pattern type');
        error.statusCode = 400;
        error.code = 'INVALID_PATTERN';
        return next(error);
    }

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const w1 = waypoints[i];
      const w2 = waypoints[i + 1];
      const R = 6371000;
      const dLat = (w2.latitude - w1.latitude) * Math.PI / 180;
      const dLng = (w2.longitude - w1.longitude) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(w1.latitude * Math.PI / 180) * Math.cos(w2.latitude * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }

    const estimatedDuration = Math.ceil(totalDistance / (speed || 5)); // seconds

    res.json({
      waypoints,
      totalDistance: totalDistance / 1000, // km
      estimatedDuration
    });
  } catch (error) {
    next(error);
  }
}

// ... imports ...

export async function getMissions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const organizationId = req.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });

    const missions = await prisma.mission.findMany({
      where: { organizationId }, // Scope
      include: {
        waypoints: {
          orderBy: { orderIndex: 'asc' }
        },
        missionExecutions: {
          orderBy: { startedAt: 'desc' },
          take: 1
        },
        _count: {
          select: { missionExecutions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // ... derived status logic ...
    const missionsWithStatus = missions.map(mission => {
      const latestExecution = mission.missionExecutions[0];
      return {
        ...mission,
        status: latestExecution ? latestExecution.status : 'pending'
      };
    });

    res.json(missionsWithStatus);
  } catch (error) {
    next(error);
  }
}

export async function getMissionById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const organizationId = req.organizationId;

    const mission = await prisma.mission.findFirst({
      where: { id, organizationId }, // Scope
      include: {
        waypoints: {
          orderBy: { orderIndex: 'asc' }
        },
        missionExecutions: {
          where: {
            status: { in: ['in-progress', 'paused'] }
          },
          orderBy: { startedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!mission) {
      const error: AppError = new Error('Mission not found');
      error.statusCode = 404;
      error.code = 'MISSION_NOT_FOUND';
      return next(error);
    }

    res.json(mission);
  } catch (error) {
    next(error);
  }
}

export async function createMission(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, description, patternType, altitude, overlapPercentage, speed, polygon, waypoints } = req.body;
    const organizationId = req.organizationId;
    const userId = req.userId;

    if (!name || !patternType || !polygon || !waypoints) {
      const error: AppError = new Error('Missing required fields');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    const mission = await prisma.mission.create({
      data: {
        name,
        description,
        patternType,
        altitude,
        overlapPercentage: overlapPercentage || 30,
        speed: speed || 5,
        polygonCoordinates: polygon,
        organizationId: organizationId!, // Link to Org
        createdById: userId!,
        waypoints: {
          create: waypoints.map((wp: any, index: number) => ({
            latitude: wp.latitude,
            longitude: wp.longitude,
            altitude: wp.altitude,
            orderIndex: wp.order || index
          }))
        }
      },
      include: {
        waypoints: true
      }
    });

    res.status(201).json(mission);
  } catch (error) {
    next(error);
  }
}

export async function updateMission(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const organizationId = req.organizationId;

    const existing = await prisma.mission.findFirst({ where: { id, organizationId } });
    if (!existing) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const mission = await prisma.mission.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description })
      }
    });

    res.json(mission);
  } catch (error) {
    next(error);
  }
}

export async function deleteMission(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const organizationId = req.organizationId;

    const result = await prisma.mission.deleteMany({
      where: { id, organizationId }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function executeMission(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { droneId } = req.body;

    if (!droneId) {
      const error: AppError = new Error('droneId is required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Validate mission exists and has waypoints
    const mission = await prisma.mission.findUnique({
      where: { id },
      include: { waypoints: true }
    });

    if (!mission) {
      const error: AppError = new Error('Mission not found');
      error.statusCode = 404;
      error.code = 'MISSION_NOT_FOUND';
      return next(error);
    }

    if (mission.waypoints.length === 0) {
      const error: AppError = new Error('Mission has no waypoints');
      error.statusCode = 400;
      error.code = 'NO_WAYPOINTS';
      return next(error);
    }

    // Validate drone exists and is available
    const drone = await prisma.drone.findUnique({
      where: { id: droneId }
    });

    if (!drone) {
      const error: AppError = new Error('Drone not found');
      error.statusCode = 404;
      error.code = 'DRONE_NOT_FOUND';
      return next(error);
    }

    if (drone.status !== 'available') {
      const error: AppError = new Error('Drone is not available');
      error.statusCode = 400;
      error.code = 'DRONE_NOT_AVAILABLE';
      return next(error);
    }

    if (drone.batteryLevel < 20) {
      const error: AppError = new Error('Drone battery is too low (must be > 20%)');
      error.statusCode = 400;
      error.code = 'INSUFFICIENT_BATTERY';
      return next(error);
    }

    // Check no other active mission for this drone
    const activeExecution = await prisma.missionExecution.findFirst({
      where: {
        droneId,
        status: {
          in: ['in-progress', 'paused']
        }
      }
    });

    if (activeExecution) {
      const error: AppError = new Error('Drone already has an active mission');
      error.statusCode = 400;
      error.code = 'DRONE_BUSY';
      return next(error);
    }

    // Create execution
    const execution = await prisma.missionExecution.create({
      data: {
        missionId: id,
        droneId,
        status: 'in-progress',
        startedAt: new Date(),
        currentWaypointIndex: 0,
        progressPercentage: 0
      }
    });

    // Update drone status
    await prisma.drone.update({
      where: { id: droneId },
      data: { status: 'in-mission' }
    });

    // Start telemetry simulation
    if (telemetrySimulator) {
      const waypoints = mission.waypoints.map(wp => ({
        latitude: wp.latitude,
        longitude: wp.longitude,
        altitude: wp.altitude,
        order: wp.orderIndex // Include order property
      }));

      telemetrySimulator.startSimulation(
        execution.id,
        waypoints,
        mission.speed,
        drone.batteryLevel
      );
    }

    res.status(201).json({
      executionId: execution.id,
      execution
    });
  } catch (error) {
    next(error);
  }
}

export async function getMissionExecutions(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const executions = await prisma.missionExecution.findMany({
      where: { missionId: id },
      include: {
        drone: true,
        report: true
      },
      orderBy: { startedAt: 'desc' }
    });

    res.json(executions);
  } catch (error) {
    next(error);
  }
}

export async function getExecutionById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const execution = await prisma.missionExecution.findUnique({
      where: { id },
      include: {
        mission: {
          include: { waypoints: true }
        },
        drone: true,
        telemetry: {
          orderBy: { timestamp: 'asc' }
        },
        report: true
      }
    });

    if (!execution) {
      const error: AppError = new Error('Execution not found');
      error.statusCode = 404;
      error.code = 'EXECUTION_NOT_FOUND';
      return next(error);
    }

    res.json(execution);
  } catch (error) {
    next(error);
  }
}

export async function pauseExecution(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const execution = await prisma.missionExecution.findUnique({
      where: { id }
    });

    if (!execution) {
      const error: AppError = new Error('Execution not found');
      error.statusCode = 404;
      error.code = 'EXECUTION_NOT_FOUND';
      return next(error);
    }

    if (execution.status !== 'in-progress') {
      const error: AppError = new Error('Execution is not in progress');
      error.statusCode = 400;
      error.code = 'INVALID_STATUS';
      return next(error);
    }

    if (telemetrySimulator) {
      telemetrySimulator.pause(id);
    }

    await prisma.missionExecution.update({
      where: { id },
      data: { status: 'paused' }
    });

    res.json({ message: 'Mission paused' });
  } catch (error) {
    next(error);
  }
}

export async function resumeExecution(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const execution = await prisma.missionExecution.findUnique({
      where: { id }
    });

    if (!execution) {
      const error: AppError = new Error('Execution not found');
      error.statusCode = 404;
      error.code = 'EXECUTION_NOT_FOUND';
      return next(error);
    }

    if (execution.status !== 'paused') {
      const error: AppError = new Error('Execution is not paused');
      error.statusCode = 400;
      error.code = 'INVALID_STATUS';
      return next(error);
    }

    if (telemetrySimulator) {
      telemetrySimulator.resume(id);
    }

    await prisma.missionExecution.update({
      where: { id },
      data: { status: 'in-progress' }
    });

    res.json({ message: 'Mission resumed' });
  } catch (error) {
    next(error);
  }
}

export async function abortExecution(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const execution = await prisma.missionExecution.findUnique({
      where: { id }
    });

    if (!execution) {
      const error: AppError = new Error('Execution not found');
      error.statusCode = 404;
      error.code = 'EXECUTION_NOT_FOUND';
      return next(error);
    }

    if (execution.status === 'completed') {
      const error: AppError = new Error('Mission already completed');
      error.statusCode = 400;
      error.code = 'ALREADY_COMPLETED';
      return next(error);
    }

    if (telemetrySimulator) {
      telemetrySimulator.abort(id);
    }

    await prisma.missionExecution.update({
      where: { id },
      data: { status: 'aborted' }
    });

    // Update drone status
    await prisma.drone.update({
      where: { id: execution.droneId },
      data: { status: 'available' }
    });

    res.json({ message: 'Mission aborted' });
  } catch (error) {
    next(error);
  }
}

export async function getAllExecutions(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.query;

    // Build where clause safely
    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const executions = await prisma.missionExecution.findMany({
      where,
      include: {
        mission: {
          include: {
            waypoints: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    res.json(executions);
  } catch (error) {
    next(error);
  }
}
