/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from 'express';
import prisma from '../../../shared/prisma';
import { Prisma, TravelBuddyRequest, Trip } from '@prisma/client';
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

  // Search term logic (add mode: 'insensitive' for other text fields if needed)
  if (searchTerm) {
    andConditions.push({
      OR: tripSearchableFields.map((field) => {
        if (field === 'activities') {
          return {
            activities: {
              // Checks if the searchTerm is an element in the activities array
              has: searchTerm, // 'has' is often preferred for array element checks
            },
          };
        }
        // For other text fields like destination, description, type
        return {
          [field]: {
            contains: searchTerm,
            mode: 'insensitive', // Makes 'contains' case-insensitive for regular string fields
          },
        };
      }),
    });
  }

  // Specific filters from filteredData
  if (Object.keys(filteredData).length > 0) {
    const specificFilters: Prisma.TripWhereInput[] = [];
    for (const key in filteredData) {
      if (Object.prototype.hasOwnProperty.call(filteredData, key)) {
        const value = (filteredData as any)[key];

        if (key === 'activities') {
          if (typeof value === 'string' && value.trim() !== '') {
            // Find trips where the activities array contains this single string value
            specificFilters.push({ activities: { has: value } });
          } else if (
            Array.isArray(value) &&
            value.length > 0 &&
            value.every((item) => typeof item === 'string')
          ) {
            // If an array is passed, you might want to find trips that have ALL activities (hasEvery)
            // or ANY of the activities (hasSome)
            specificFilters.push({ activities: { hasEvery: value } }); // Example: has all
            // Or: specificFilters.push({ activities: { hasSome: value } }); // Example: has any
          } else {
            console.warn(
              `'activities' filter value is not a valid string or array of strings:`,
              value
            );
          }
        } else if (key === 'destination' || key === 'type' || key === 'description') {
          specificFilters.push({
            [key]: { contains: String(value), mode: 'insensitive' },
          });
        } else if (key === 'budget') {
          const numericValue = parseFloat(value);
          if (!isNaN(numericValue)) {
            specificFilters.push({ budget: { equals: numericValue } });
          } else if (typeof value === 'object' && value !== null) {
            // For range: {min: 100, max: 500}
            const budgetRange: { gte?: number; lte?: number } = {};
            if ((value as any).min !== undefined) budgetRange.gte = parseFloat((value as any).min);
            if ((value as any).max !== undefined) budgetRange.lte = parseFloat((value as any).max);
            if (Object.keys(budgetRange).length > 0 && !Object.values(budgetRange).some(isNaN)) {
              specificFilters.push({ budget: budgetRange });
            } else {
              console.warn(`Budget range filter is not valid:`, value);
            }
          } else {
            console.warn(`Budget filter value is not a processable number or range:`, value);
          }
        } else if (key === 'startDate' || key === 'endDate') {
          try {
            const dateValue = new Date(value);
            // This will filter for trips where the date field exactly matches the start of the given date.
            // For date ranges (e.g., trips starting AFTER a date, or BEFORE a date), you'd use gte/lte.
            specificFilters.push({ [key]: { equals: dateValue } });
          } catch (e) {
            console.warn(`Invalid date format for ${key}:`, value);
          }
        } else if (key === 'userId') {
          // If you want to filter by the user who created the trip
          specificFilters.push({ userId: { equals: String(value) } });
        }
        // Add other specific field handlers as needed
      }
    }
    if (specificFilters.length > 0) {
      andConditions.push({ AND: specificFilters });
    }
  }

  const whereConditions: Prisma.TripWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // ... rest of your function (findMany, count, return)
  const result = await prisma.trip.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      travelBuddyRequest: true,
    },
  });

  const total = await prisma.trip.count({ where: whereConditions });

  return {
    meta: { page, limit, total },
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

const sendTravelBuddyRequest = async (
  tripId: string,
  payload: Partial<TravelBuddyRequest>,
  user: IAuthUser
) => {
  const trip = await prisma.trip.findUniqueOrThrow({
    where: {
      id: tripId,
    },
  });
  if (trip.userId === user?.userId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not allowed to request');
  }
  const result = await prisma.travelBuddyRequest.create({
    data: {
      tripId,
      message: payload.message,
      userId: user?.userId as string,
    },
  });
  return result;
};

export const TripServices = {
  createTripIntoDB,
  getSingleTripFromDB,
  getAllTripsFromDB,
  updateTripIntoDB,
  deleteTripFromDB,
  sendTravelBuddyRequest,
};
