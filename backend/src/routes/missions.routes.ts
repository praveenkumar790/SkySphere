import { Router } from 'express';
import {
  generateWaypoints,
  getMissions,
  getMissionById,
  createMission,
  updateMission,
  deleteMission,
  executeMission,
  getMissionExecutions,
  getExecutionById,
  pauseExecution,
  resumeExecution,
  abortExecution,
  getAllExecutions
} from '../controllers/missions.controller';
import { authMiddleware, authorize } from '../middleware/auth.middleware';

const router = Router();

// Apply authMiddleware globally
router.use(authMiddleware);

// Waypoint generation
router.post('/generate-waypoints', authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR']), generateWaypoints);

// Execution control
router.get('/executions/:id', authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR', 'VIEWER']), getExecutionById);
router.post('/executions/:id/pause', authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR']), pauseExecution);
router.post('/executions/:id/resume', authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR']), resumeExecution);
router.post('/executions/:id/abort', authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR']), abortExecution);

// Global executions (history)
router.get('/history', authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR', 'VIEWER']), getAllExecutions);

// Mission CRUD
router.get('/', authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR', 'VIEWER']), getMissions);
router.get('/:id', authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR', 'VIEWER']), getMissionById);
router.post('/', authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR']), createMission);
router.put('/:id', authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR']), updateMission);
router.delete('/:id', authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR']), deleteMission);

// Mission execution
router.post('/:id/execute', authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR']), executeMission);
router.get('/:id/executions', authorize(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR', 'VIEWER']), getMissionExecutions);

export default router;
