import express from 'express';
import { AuthControllers } from './auth.controller';
import validateRequest from '../../middlewares/validateRequest';
import { AuthValidations } from './auth.validation';
const router = express.Router();

router.post('/login', validateRequest(AuthValidations.loginZodSchema), AuthControllers.loginUser);

router.post(
  '/refresh-token',
  validateRequest(AuthValidations.refreshTokenZodSchema),
  AuthControllers.refreshToken
);

export const AuthRoutes = router;
