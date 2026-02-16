import { Router } from 'express';
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser
} from '../controllers/users.controller';
import { authMiddleware, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.use(authorize(['SUPER_ADMIN', 'ORG_ADMIN']));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
