/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from 'express';
import prisma from '../../../shared/prisma';
import { Prisma, Trip } from '@prisma/client';
import { IUploadFile } from '../../../interfaces/file';
import { FileUploadHelper } from '../../../helpers/fileUploadHelper';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { TPaginationOptions } from '../../../interfaces/pagination';
import { tripSearchableFields } from './trip.constant';

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

const getAllTripsFromDB = async (params: any, options: TPaginationOptions) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filteredData } = params;

  const andConditions: Prisma.TripWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: tripSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
        },
      })),
    });
  }
  if (Object.keys(filteredData).length > 0) {
    andConditions.push({
      AND: Object.keys(filteredData).map((key) => ({
        [key]: {
          equals: (filteredData as any)[key],
        },
      })),
    });
  }
  const whereConditions: Prisma.TripWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};
  const result = await prisma.trip.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: 'desc',
          },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      travelBuddyRequest: true,
    },
  });
  const total = await prisma.trip.count({
    where: whereConditions,
  });
  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

export const TripServices = {
  createTripIntoDB,
  getSingleTripFromDB,
  getAllTripsFromDB,
};
