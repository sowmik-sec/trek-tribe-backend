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

const updateTripZodSchema = z.object({
  destination: z.string().min(1).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  budget: z.coerce.number().nonnegative().optional(),
  type: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  itinerary: z.string().nullable().optional(),
  photos: z.array(photoSchema).optional(),
  activities: z.array(z.string()).optional(),
});

const createSendTravelBuddyRequestSchema = z.object({
  body: z.object({
    message: z.string().optional(),
  }),
});

export const TripValidations = {
  createTripZodSchema,
  updateTripZodSchema,
  createSendTravelBuddyRequestSchema,
};
