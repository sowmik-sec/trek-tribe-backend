import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IAuthUser } from '../../../interfaces/common';
import prisma from '../../../shared/prisma';
import { RequestStatus } from '@prisma/client';

const getTravelBuddiesFromDB = async (tripId: string, user: IAuthUser) => {
  const trip = await prisma.trip.findUniqueOrThrow({
    where: {
      id: tripId,
      userId: user?.userId,
    },
  });
  if (!trip) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Trip not found or you are not authorized');
  }
  return await prisma.travelBuddyRequest.findMany({
    where: {
      tripId,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          profile: true,
        },
      },
    },
  });
};

const responseToTravelBuddyRequest = async (
  tripId: string,
  buddyId: string,
  status: RequestStatus,
  user: IAuthUser
) => {
  await prisma.trip.findFirstOrThrow({
    where: {
      id: tripId,
      userId: user?.userId,
    },
  });

  const result = await prisma.travelBuddyRequest.update({
    where: {
      tripId_userId: {
        tripId,
        userId: buddyId,
      },
    },
    data: {
      status,
    },
  });
  return result;
};

export const TravelBuddyRequestServices = {
  getTravelBuddiesFromDB,
  responseToTravelBuddyRequest,
};
