import { Router } from 'express';
import {
  getDrones,
  getDroneById,
  createDrone,
  updateDrone,
  deleteDrone
} from '../controllers/drones.controller';
import { authMiddleware, authorize } from '../middleware/auth.middleware';

const router = Router();

// Apply authMiddleware globally to all drone routes
router.use(authMiddleware);

router.get('/', authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR', 'VIEWER']), getDrones);
router.get('/:id', authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR', 'VIEWER']), getDroneById);
router.post('/', authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR']), createDrone);
router.put('/:id', authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR']), updateDrone);
router.delete('/:id', authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR']), deleteDrone);

export default router;
