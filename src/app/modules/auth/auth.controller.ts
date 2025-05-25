import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import { AuthServices } from './auth.service';
import config from '../../../config';
import sendResponse from '../../../shared/sendResponse';
import { ILoginUserResponse, IRefreshTokenResponse } from './auth.interface';

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginUser(req.body);
  const { refreshToken } = result;
  const cookieOptions = {
    secure: config.env === 'production',
    httpOnly: true,
  };
  res.cookie('refreshToken', refreshToken, cookieOptions);
  sendResponse<ILoginUserResponse>(res, {
    statusCode: 200,
    success: true,
    message: 'User logged in successfully !',
    data: {
      accessToken: result.accessToken,
    },
  });
});
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  const result = await AuthServices.refreshToken(refreshToken);

  sendResponse<IRefreshTokenResponse>(res, {
    statusCode: 200,
    success: true,
    message: 'Token refreshed successfully !',
    data: result,
  });
});
const changePassword = catchAsync(async (req: Request, res: Response) => {
  await AuthServices.changePassword(req.user, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password changed successfully !',
    data: {
      status: 200,
      message: 'Password Changed successfully!',
    },
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthServices.forgotPassword(req.body.email);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Check your email!',
    data: {
      status: 200,
      message: 'Check your email for reset link!',
    },
  });
});

export const AuthControllers = {
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
};
