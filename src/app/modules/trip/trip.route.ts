import express, { NextFunction, Request, Response } from 'express';
import { TripControllers } from './trip.controller';
import { FileUploadHelper } from '../../../helpers/fileUploadHelper';
import { TripValidations } from './trip.validation';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
const router = express.Router();

router.post(
  '/create-trip',
  auth(UserRole.ADMIN, UserRole.USER),
  FileUploadHelper.upload.single('file'),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = TripValidations.createTripZodSchema.parse(JSON.parse(req.body.data));
    return TripControllers.createTrip(req, res, next);
  }
);

router.get('/:id', auth(UserRole.ADMIN, UserRole.USER), TripControllers.getTrip);

export const TripRoutes = router;
