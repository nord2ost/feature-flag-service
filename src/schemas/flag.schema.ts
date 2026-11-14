import { z } from 'zod';

// Schema for creating a brand-new flag (POST /api/flags)
export const createFlagSchema = z.object({
    key: z
        .string()
        .min(2, 'Key must be at least 2 characters')
        .max(50, 'Key must be 50 characters or less')
        .regex(/^[a-z0-9_]+$/, 'Key can only contain lowercase letters, numbers, and underscores'),
    description: z.string().min(3, 'Description is required').max(200),
    enabled: z.boolean().optional().default(false),
    payload: z.record(z.string(), z.unknown()).optional().default({}),
});

// Schema for updating an existing flag (PATCH /api/flags/:key)
export const updateFlagSchema = z.object({
    enabled: z.boolean().optional(),
    description: z.string().min(3).max(200).optional(),
    payload: z.record(z.string(), z.unknown()).optional(),
});
