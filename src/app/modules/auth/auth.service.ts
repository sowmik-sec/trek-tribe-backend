/* eslint-disable @typescript-eslint/no-unused-vars */
import { UserStatus } from '@prisma/client';
import prisma from '../../../shared/prisma';
import {
  IChangePassword,
  ILoginUser,
  ILoginUserResponse,
  IRefreshTokenResponse,
} from './auth.interface';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { AuthUtils } from './auth.utils';
import { jwtHelpers } from '../../../helpers/jwtHelpers';
import config from '../../../config';
import { JwtPayload, Secret } from 'jsonwebtoken';
import { hashedPassword } from '../user/user.utils';
import { sendEmail } from './sendResetMail';
import bcrypt from 'bcrypt';
import { IAuthUser } from '../../../interfaces/common';

const loginUser = async (payload: ILoginUser): Promise<ILoginUserResponse> => {
  const { email, password } = payload;
  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
      status: UserStatus.ACTIVE,
    },
  });
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (isUserExist.password && !(await AuthUtils.comparePasswords(password, isUserExist.password))) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Password is incorrect');
  }

  const { id: userId, role } = isUserExist;
  const accessToken = jwtHelpers.createToken(
    { userId, role, email },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expires_in as string
  );
  const refreshToken = jwtHelpers.createToken(
    { userId, role, email },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (token: string): Promise<IRefreshTokenResponse> => {
  let verifiedToken = null;
  try {
    verifiedToken = jwtHelpers.verifyToken(token, config.jwt.refresh_token_secret as Secret);
  } catch (error) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Invalid Refresh Token');
  }
  const { userId } = verifiedToken;

  const isUserExist = await prisma.user.findUnique({
    where: {
      id: userId,
      status: UserStatus.ACTIVE,
    },
  });
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User does not exist');
  }
  const newAccessToken = jwtHelpers.createToken(
    { userId: isUserExist.id, role: isUserExist.role, email: isUserExist.email },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expires_in as string
  );
  return {
    accessToken: newAccessToken,
  };
};

const changePassword = async (user: JwtPayload | null, payload: IChangePassword): Promise<void> => {
  const { oldPassword, newPassword } = payload;
  const isUserExist = await prisma.user.findUnique({
    where: {
      id: user?.userId,
      status: UserStatus.ACTIVE,
    },
  });
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User does not exist!');
  }
  if (
    isUserExist.password &&
    !(await AuthUtils.comparePasswords(oldPassword, isUserExist.password))
  ) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Old Password is incorrect');
  }
  const hashPassword = await hashedPassword(newPassword);
  await prisma.user.update({
    where: {
      id: isUserExist.id,
    },
    data: {
      password: hashPassword,
    },
  });
};

const forgotPassword = async (email: string) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
      status: UserStatus.ACTIVE,
    },
  });
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User does not exist');
  }
  const passResetToken = await jwtHelpers.createPasswordResetToken({
    id: isUserExist.id,
  });
  const resetLink: string = config.reset_link + `?id=${isUserExist.id}&token=${passResetToken}`;

  await sendEmail(
    email,
    `
      <div>
        <p>Dear ${isUserExist.role},</p>
        <p>Your password reset link: <a href=${resetLink}><button>RESET PASSWORD<button/></a></p>
        <p>Thank you</p>
      </div>
  `
  );
};

const resetPassword = async (payload: { email: string; newPassword: string }, token: string) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      email: payload.email,
      status: UserStatus.ACTIVE,
    },
  });
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User does not exist');
  }
  const isVerified = jwtHelpers.verifyToken(token, config.jwt.jwt_secret as Secret);
  if (!isVerified) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized');
  }
  const password = await bcrypt.hash(payload.newPassword, Number(config.bcrypt_salt_rounds));
  await prisma.user.update({
    where: {
      email: payload.email,
    },
    data: {
      password,
    },
  });
};

const getUserProfile = async (user: IAuthUser) => {
  const result = await prisma.user.findUniqueOrThrow({
    where: {
      id: user?.userId,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
    },
  });
  return result;
};

export const AuthServices = {
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getUserProfile,
};
