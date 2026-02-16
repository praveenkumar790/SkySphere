import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/database';
import { UserRole } from '@prisma/client';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    organizationName: z.preprocess(val => (val === '' ? undefined : val), z.string().min(2).optional()),
    joinCode: z.preprocess(val => (val === '' ? undefined : val), z.string().optional())
}).refine(data => data.organizationName || data.joinCode, {
    message: "Either organizationName or joinCode is required",
    path: ["organizationName"]
});

const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

export const register = async (req: Request, res: Response) => {
    try {
        const data = registerSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        let organization: any;
        let role: UserRole = UserRole.OPERATOR;

        if (data.joinCode) {
            // Join existing org
            organization = await prisma.organization.findUnique({
                where: { joinCode: data.joinCode.toUpperCase() }
            });

            if (!organization) {
                return res.status(400).json({ error: 'Invalid join code' });
            }
        } else if (data.organizationName) {
            // Check if organization name already exists to prevent duplicates
            const existingOrg = await prisma.organization.findFirst({
                where: { name: { equals: data.organizationName, mode: 'insensitive' } }
            });

            if (existingOrg) {
                return res.status(400).json({
                    error: `Organization "${data.organizationName}" already exists. Please join using a code or choose a different name to establish a new one.`
                });
            }

            // Create new org
            const slug = data.organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(7);

            organization = await prisma.organization.create({
                data: {
                    name: data.organizationName,
                    slug: slug,
                    joinCode: generateJoinCode()
                }
            });
            role = UserRole.ORG_ADMIN;

            // Seed initial fleet for new organization
            await prisma.drone.createMany({
                data: [
                    { name: 'Sentinel-01', model: 'DJI Matrice 300', status: 'available', batteryLevel: 100, organizationId: organization.id },
                    { name: 'Guardian-Alpha', model: 'DJI Mavic 3', status: 'available', batteryLevel: 95, organizationId: organization.id },
                    { name: 'Scout-X', model: 'Autel Evo II', status: 'maintenance', batteryLevel: 45, organizationId: organization.id },
                    { name: 'Raptor-7', model: 'DJI Phantom 4', status: 'available', batteryLevel: 88, organizationId: organization.id },
                    { name: 'Falcon-Heavy', model: 'Freefly Alta X', status: 'in-mission', batteryLevel: 72, organizationId: organization.id, currentLat: 28.6139, currentLng: 77.2090 }
                ]
            });
        } else {
            return res.status(400).json({ error: 'Organization details missing' });
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash: hashedPassword,
                name: data.name,
                role: role,
                organizationId: organization.id
            }
        });

        const token = jwt.sign(
            {
                userId: user.id,
                organizationId: user.organizationId,
                role: user.role
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: user.organizationId,
                organization: {
                    id: organization.id,
                    name: organization.name,
                    slug: organization.slug,
                    joinCode: organization.joinCode
                }
            }
        });
    } catch (error: any) {
        // console.error('Register error occurred - check response details');

        let errorMessage = 'Registration failed';
        if (error instanceof z.ZodError) {
            errorMessage = error.errors.map(e => e.message).join(', ');
        } else if (error?.message) {
            errorMessage = error.message;
        }

        res.status(400).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const data = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: { email: data.email },
            include: { organization: true }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(data.password, user.passwordHash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                organizationId: user.organizationId,
                role: user.role
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: user.organizationId,
                organization: user.organization
            }
        });
    } catch (error) {
        res.status(400).json({ error: 'Login failed', details: error });
    }
};

export const me = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true }
    });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization
    });
};
