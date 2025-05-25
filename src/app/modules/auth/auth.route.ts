import express from 'express';
import { AuthControllers } from './auth.controller';
import validateRequest from '../../middlewares/validateRequest';
import { AuthValidations } from './auth.validation';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
const router = express.Router();

router.post('/login', validateRequest(AuthValidations.loginZodSchema), AuthControllers.loginUser);

router.post(
  '/refresh-token',
  validateRequest(AuthValidations.refreshTokenZodSchema),
  AuthControllers.refreshToken
);

router.post(
  '/change-password',
  validateRequest(AuthValidations.changePasswordZodSchema),
  auth(UserRole.USER, UserRole.ADMIN),
  AuthControllers.changePassword
);

router.post('/forgot-password', AuthControllers.forgotPassword);

export const AuthRoutes = router;
