import express, { NextFunction, Request, Response } from 'express';
import { UserValidations } from './user.validation';
import { UserControllers } from './user.controller';
import { FileUploadHelper } from '../../../helpers/fileUploadHelper';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
const router = express.Router();

router.get('/', auth(UserRole.ADMIN), UserControllers.getAllUsers);

router.post(
  '/register',
  FileUploadHelper.upload.single('file'),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = UserValidations.createUserZodSchema.parse(JSON.parse(req.body.data));
    return UserControllers.createUser(req, res, next);
  }
);
router.post(
  '/update-profile',
  auth(UserRole.USER, UserRole.ADMIN),
  FileUploadHelper.upload.single('file'),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = UserValidations.updateUserZodSchema.parse(JSON.parse(req.body.data));
    return UserControllers.updateUser(req, res, next);
  }
);

router.patch('/:id', auth(UserRole.ADMIN), UserControllers.updateRoleOrActiveStatus);

export const UserRoutes = router;
