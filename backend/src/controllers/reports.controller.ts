import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export async function getReports(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate } = req.query;
    const organizationId = req.organizationId;

    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });

    const where: any = {
      execution: {
        mission: {
          organizationId: organizationId
        }
      }
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const reports = await prisma.surveyReport.findMany({
      where,
      include: {
        execution: {
          include: {
            mission: true,
            drone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    next(error);
  }
}

export async function getReportById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const organizationId = req.organizationId;

    // Ensure filtering by Org
    const report = await prisma.surveyReport.findFirst({
      where: {
        id,
        execution: { mission: { organizationId } }
      },
      include: {
        execution: {
          include: {
            mission: {
              include: { waypoints: true }
            },
            drone: true,
            telemetry: {
              orderBy: { timestamp: 'asc' }
            }
          }
        }
      }
    });

    if (!report) {
      const error: AppError = new Error('Report not found');
      error.statusCode = 404;
      error.code = 'REPORT_NOT_FOUND';
      return next(error);
    }

    res.json(report);
  } catch (error) {
    next(error);
  }
}

export async function getStatistics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate } = req.query;
    const organizationId = req.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });

    const where: any = {
      execution: {
        mission: {
          organizationId
        }
      }
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const reports = await prisma.surveyReport.findMany({
      where,
      include: {
        execution: {
          include: { mission: true }
        }
      }
    });

    const totalSurveys = reports.length;
    const totalDistance = reports.reduce((sum, r) => sum + r.totalDistance, 0);
    const totalDuration = reports.reduce((sum, r) => sum + r.totalDuration, 0);
    const avgDuration = totalSurveys > 0 ? totalDuration / totalSurveys : 0;
    const totalCoverage = reports.reduce((sum, r) => sum + r.coverageArea, 0);

    // New Stats
    const maxSpeedRecorded = reports.reduce((max, r) => Math.max(max, r.maxSpeed || 0), 0);
    const maxAltitudeRecorded = reports.reduce((max, r) => Math.max(max, r.maxAltitude || 0), 0);
    const totalBatteryConsumed = reports.reduce((sum, r) => sum + (r.batteryConsumed || 0), 0);

    res.json({
      totalSurveys,
      totalDistance,
      totalDuration,
      avgDuration: Math.round(avgDuration),
      totalCoverage,
      maxSpeedRecorded: Math.round(maxSpeedRecorded * 10) / 10,
      maxAltitudeRecorded: Math.round(maxAltitudeRecorded * 10) / 10,
      totalBatteryConsumed
    });
  } catch (error) {
    next(error);
  }
}
