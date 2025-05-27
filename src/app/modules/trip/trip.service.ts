import { Request } from 'express';
import prisma from '../../../shared/prisma';
import { Prisma, Trip } from '@prisma/client';
import { IUploadFile } from '../../../interfaces/file';
import { FileUploadHelper } from '../../../helpers/fileUploadHelper';

const createTripIntoDB = async (req: Request) => {
  const file = req.file as IUploadFile;
  let photos: Prisma.InputJsonValue = [];
  if (file) {
    const uploadProfileImage = await FileUploadHelper.uploadToCloudinary(file);
    photos = [
      {
        url: uploadProfileImage?.secure_url,
        isDeleted: false,
      },
    ];
  }

  const createTrip = await prisma.trip.create({
    data: {
      ...req.body,
      userId: req.user?.userId,
      photos,
    },
  });

  return createTrip;
};

const getSingleTripFromDB = async (id: string): Promise<Trip | undefined | null> => {
  const result = await prisma.trip.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
  return result;
};

export const TripServices = {
  createTripIntoDB,
  getSingleTripFromDB,
};
