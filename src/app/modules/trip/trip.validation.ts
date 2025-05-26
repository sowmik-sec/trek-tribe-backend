import { z } from 'zod';

// Define the shape of each photo
const photoSchema = z.object({
  url: z.string().url(),
  isDeleted: z.boolean(),
});

// Main Trip schema
const createTripZodSchema = z.object({
  destination: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  budget: z.coerce.number().nonnegative(),
  type: z.string().min(1),
  description: z.string().min(1),
  itinerary: z.string().nullable().optional(),
  photos: z.array(photoSchema).optional().default([]),
  activities: z.array(z.string()).default([]),
});

export const TripValidations = {
  createTripZodSchema,
};
