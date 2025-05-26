import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import { TripServices } from './trip.service';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

const createTrip = catchAsync(async (req: Request, res: Response) => {
  const result = await TripServices.createTripIntoDB(req);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Trip created successfully',
    data: result,
  });
});

export const TripControllers = {
  createTrip,
};
