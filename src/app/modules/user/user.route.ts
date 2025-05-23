import express, { NextFunction, Request, Response } from 'express';
import { UserValidations } from './user.validation';
import { UserControllers } from './user.controller';
import { FileUploadHelper } from '../../../helpers/fileUploadHelper';
const router = express.Router();

router.post(
  '/register',
  FileUploadHelper.upload.single('file'),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = UserValidations.createUserZodSchema.parse(JSON.parse(req.body.data));
    return UserControllers.createUser(req, res, next);
  }
);

export const UserRoutes = router;
