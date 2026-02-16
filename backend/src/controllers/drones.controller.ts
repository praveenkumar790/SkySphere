import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export async function getDrones(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, minBattery } = req.query;
    const organizationId = req.organizationId;

    if (!organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const where: any = { organizationId }; // Scope by Org
    if (status) where.status = status;
    if (minBattery) where.batteryLevel = { gte: parseInt(minBattery as string) };

    const drones = await prisma.drone.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { name: true } } } // Optional: see who added it
    });

    res.json(drones);
  } catch (error) {
    next(error);
  }
}

export async function getDroneById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const organizationId = req.organizationId;

    // Find unique drone AND ensure it belongs to the user's org
    const drone = await prisma.drone.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!drone) {
      const error: AppError = new Error('Drone not found');
      error.statusCode = 404;
      error.code = 'DRONE_NOT_FOUND';
      return next(error);
    }

    res.json(drone);
  } catch (error) {
    next(error);
  }
}

export async function createDrone(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, model, batteryLevel, currentLat, currentLng } = req.body;
    const organizationId = req.organizationId;
    const userId = req.userId;

    if (!name || !model) {
      const error: AppError = new Error('Name and model are required');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    const drone = await prisma.drone.create({
      data: {
        name,
        model,
        status: 'available',
        batteryLevel: batteryLevel || 100,
        currentLat,
        currentLng,
        organizationId: organizationId!,
        createdById: userId
      }
    });

    res.status(201).json(drone);
  } catch (error) {
    next(error);
  }
}

export async function updateDrone(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, batteryLevel, currentLat, currentLng } = req.body;
    const organizationId = req.organizationId;

    // Verify ownership first (or let updateMany handle 0 count, but explicit check is better for 404)
    const existing = await prisma.drone.findFirst({ where: { id, organizationId } });
    if (!existing) {
      return res.status(404).json({ error: 'Drone not found' });
    }

    const drone = await prisma.drone.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(batteryLevel !== undefined && { batteryLevel }),
        ...(currentLat !== undefined && { currentLat }),
        ...(currentLng !== undefined && { currentLng }),
        ...((currentLat !== undefined || currentLng !== undefined) && { lastSeen: new Date() })
      }
    });

    res.json(drone);
  } catch (error) {
    next(error);
  }
}

export async function deleteDrone(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const organizationId = req.organizationId;

    // Ensure belongs to org before delete
    const result = await prisma.drone.deleteMany({
      where: {
        id,
        organizationId
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Drone not found' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
