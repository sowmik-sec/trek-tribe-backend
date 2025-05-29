import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import { TravelBuddyRequestServices } from './travelBuddyRequest.service';
import { IAuthUser } from '../../../interfaces/common';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

const getPotentialTravelBuddies = catchAsync(async (req: Request, res: Response) => {
  const result = await TravelBuddyRequestServices.getTravelBuddiesFromDB(
    req.params.id,
    req.user as IAuthUser
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Travel buddy requests retrieved successfully',
    data: result,
  });
});
const responseToTravelBuddyRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await TravelBuddyRequestServices.responseToTravelBuddyRequest(
    req.params.tripId,
    req.params.buddyId,
    req.body.status,
    req.user as IAuthUser
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Travel buddy requests updated successfully',
    data: result,
  });
});

export const TravelBuddyRequestControllers = {
  getPotentialTravelBuddies,
  responseToTravelBuddyRequest,
};
