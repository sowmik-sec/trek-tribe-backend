import { string, z } from 'zod';

const createProfileZodSchema = z.object({
  bio: string().optional(),
  age: z.number().optional(),
});

const createUserZodSchema = z.object({
  name: z.string().min(1, 'Username required'),
  email: z.string().email({ message: '' }),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  profile: createProfileZodSchema.optional(),
});
const updateProfileZodSchema = z.object({
  bio: string().optional(),
  age: z.number().optional(),
});

const updateUserZodSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: '' }).optional(),
  profile: updateProfileZodSchema.optional(),
});

export const UserValidations = {
  createUserZodSchema,
  updateUserZodSchema,
};
