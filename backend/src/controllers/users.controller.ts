import { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    role: z.nativeEnum(UserRole)
});

const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    role: z.nativeEnum(UserRole).optional()
});

export async function getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const organizationId = req.organizationId;

        const users = await prisma.user.findMany({
            where: { organizationId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });

        res.json(users);
    } catch (error) {
        next(error);
    }
}

export async function createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const organizationId = req.organizationId;
        const data = createUserSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash: hashedPassword,
                name: data.name,
                role: data.role,
                organizationId: organizationId!
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });

        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId;
        const data = updateUserSchema.parse(req.body);

        // Ensure user belongs to the same org
        const targetUser = await prisma.user.findFirst({
            where: { id, organizationId }
        });

        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId;
        const currentUserId = req.userId;

        if (id === currentUserId) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }

        // Ensure user belongs to the same org
        const targetUser = await prisma.user.findFirst({
            where: { id, organizationId }
        });

        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        await prisma.user.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
}
