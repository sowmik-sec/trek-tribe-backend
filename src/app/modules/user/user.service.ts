import { Request } from 'express';
import { IUploadFile } from '../../../interfaces/file';
import { FileUploadHelper } from '../../../helpers/fileUploadHelper';
import { hashedPassword } from './user.utils';
import prisma from '../../../shared/prisma';
import { UserRole } from '@prisma/client';

const createUserIntoDB = async (req: Request) => {
  const file = req.file as IUploadFile;
  if (file) {
    const uploadProfileImage = await FileUploadHelper.uploadToCloudinary(file);
    req.body.profilePhoto = uploadProfileImage?.secure_url;
  }
  const hashPassword = await hashedPassword(req.body.password);
  const result = await prisma.$transaction(async (tc) => {
    const newUser = await tc.user.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        password: hashPassword,
        role: UserRole.USER,
      },
    });
    const newProfile = await tc.profile.create({
      data: {
        userId: newUser.id,
        bio: req.body.profile.bio,
        age: req.body.profile.age,
        profilePhoto: req.body.profilePhoto,
      },
    });
    return {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      age: newProfile.age,
      bio: newProfile.bio,
      profilePhoto: newProfile.profilePhoto,
      createdAt: newProfile.createdAt,
      updatedAt: newProfile.updatedAt,
    };
  });
  return result;
};

export const UserServices = {
  createUserIntoDB,
};
