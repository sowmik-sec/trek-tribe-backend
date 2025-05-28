import express from 'express';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { TravelBuddyRequestControllers } from './travelBuddyRequest.controller';
const router = express.Router();

router.get(
  '/:id',
  auth(UserRole.ADMIN, UserRole.USER),
  TravelBuddyRequestControllers.getPotentialTravelBuddies
);

export const TravelBuddyRequestRoutes = router;
