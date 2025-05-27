/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from 'express';
import prisma from '../../../shared/prisma';
import { Prisma, Trip } from '@prisma/client';
import { IUploadFile } from '../../../interfaces/file';
import { FileUploadHelper } from '../../../helpers/fileUploadHelper';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { TPaginationOptions } from '../../../interfaces/pagination';
import { tripSearchableFields } from './trip.constant';
import { TPhoto } from './trip.interface';
import { IAuthUser } from '../../../interfaces/common';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';

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
const updateTripIntoDB = async (
  payload: Partial<Omit<Trip, 'photos'>> & { photos?: TPhoto[] },
  tripId: string,
  req: Request
): Promise<Trip> => {
  // Step 1: Ensure trip exists and belongs to user
  const existingTrip = await prisma.trip.findUniqueOrThrow({
    where: {
      id: tripId,
      userId: req.user?.userId,
    },
  });

  const file = req.file as IUploadFile;
  const existingPhotos = (existingTrip.photos || []) as TPhoto[];

  // Step 2: Filter out deleted photos
  const updatedPhotos = existingPhotos.filter(
    (photo) => !payload.photos?.some((p) => p.url === photo.url && p.isDeleted)
  );

  // Step 3: Add new uploaded photo (if any)
  if (file) {
    const uploadedImage = await FileUploadHelper.uploadToCloudinary(file);
    if (uploadedImage?.secure_url) {
      updatedPhotos.push({
        url: uploadedImage.secure_url,
        isDeleted: false,
      });
    }
  }

  // Step 4: Prepare and send update
  const updatedData: Prisma.TripUpdateInput = {
    ...payload,
    photos: updatedPhotos,
    updatedAt: new Date(),
  };

  const updatedTrip = await prisma.trip.update({
    where: { id: tripId },
    data: updatedData,
  });

  return updatedTrip;
};

const deleteTripFromDB = async (tripId: string, user: IAuthUser): Promise<Trip> => {
  // Step 1: Find the trip
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
  });

  // Step 2: Authorization — Only the owner or an ADMIN can delete
  const isOwner = trip.userId === user?.userId;
  const isAdmin = user?.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You are not authorized to delete this trip');
  }

  // Step 3: Transactionally delete related data
  const deletedTrip = await prisma.$transaction(async (tx) => {
    await tx.travelBuddyRequest.deleteMany({
      where: { tripId },
    });

    return await tx.trip.delete({
      where: { id: tripId },
    });
  });

  return deletedTrip;
};

export const TripServices = {
  createTripIntoDB,
  getSingleTripFromDB,
  getAllTripsFromDB,
  updateTripIntoDB,
  deleteTripFromDB,
};
