import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IAuthUser } from '../../../interfaces/common';
import prisma from '../../../shared/prisma';

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

export const TravelBuddyRequestServices = {
  getTravelBuddiesFromDB,
};
