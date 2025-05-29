import { z } from 'zod';

const RequestStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

const updateStatusZodSchema = z.object({
  body: z.object({
    status: RequestStatusEnum,
  }),
});

export const TravelBuddyRequestValidations = {
  updateStatusZodSchema,
};
