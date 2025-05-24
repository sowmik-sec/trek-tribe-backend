import { UserRole } from '@prisma/client';

export type ILoginUser = {
  email: string;
  password: string;
};

export type ILoginUserResponse = {
  accessToken: string;
  refreshToken?: string;
};

export type IRefreshTokenResponse = {
  accessToken: string;
};

export type IVerifiedLoginUser = {
  userId: string;
  role: UserRole;
};

export type IChangePassword = {
  oldPassword: string;
  newPassword: string;
};
