import express from 'express';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { TravelBuddyRequestControllers } from './travelBuddyRequest.controller';
import validateRequest from '../../middlewares/validateRequest';
import { TravelBuddyRequestValidations } from './travelBuddyRequestValidation';
const router = express.Router();

router.get(
  '/:id',
  auth(UserRole.ADMIN, UserRole.USER),
  TravelBuddyRequestControllers.getPotentialTravelBuddies
);

router.patch(
  '/:tripId/:buddyId/respond',
  auth(UserRole.ADMIN, UserRole.USER),
  validateRequest(TravelBuddyRequestValidations.updateStatusZodSchema),
  TravelBuddyRequestControllers.responseToTravelBuddyRequest
);

export const TravelBuddyRequestRoutes = router;
