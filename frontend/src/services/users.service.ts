import api from './api';
import { User } from '../types/auth';

export interface CreateUserData {
    email: string;
    name: string;
    role: 'ORG_ADMIN' | 'OPERATOR' | 'VIEWER';
    password?: string; // Optional if we generate it or let them set it
}

export const userService = {
    getUsers: async () => {
        const response = await api.get<User[]>('/users');
        return response.data;
    },

    createUser: async (data: CreateUserData) => {
        // For this version, we require a password. 
        // In a real app, this might send an invite email.
        const response = await api.post<User>('/users', {
            ...data,
            password: data.password || 'TemporaryPassword123!'
        });
        return response.data;
    },

    updateUser: async (id: string, data: Partial<CreateUserData>) => {
        const response = await api.put<User>(`/users/${id}`, data);
        return response.data;
    },

    deleteUser: async (id: string) => {
        await api.delete(`/users/${id}`);
    }
};
