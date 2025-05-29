import express from 'express';
import { AuthControllers } from './auth.controller';
import validateRequest from '../../middlewares/validateRequest';
import { AuthValidations } from './auth.validation';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
const router = express.Router();

router.get('/profile', auth(UserRole.USER, UserRole.ADMIN), AuthControllers.getUserProfile);

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
router.post('/reset-password', AuthControllers.resetPassword);

export const AuthRoutes = router;
