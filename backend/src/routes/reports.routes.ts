import { Router } from 'express';
import {
  getReports,
  getReportById,
  getStatistics
} from '../controllers/reports.controller';
import { authMiddleware, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

const allRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR', 'VIEWER'];

router.get('/', authorize(allRoles), getReports);
router.get('/statistics', authorize(allRoles), getStatistics);
router.get('/:id', authorize(allRoles), getReportById);

export default router;
