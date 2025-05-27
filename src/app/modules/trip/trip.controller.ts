import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import { TripServices } from './trip.service';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { tripFilterableFields } from './trip.constant';
import { IAuthUser } from '../../../interfaces/common';

const createTrip = catchAsync(async (req: Request, res: Response) => {
  const result = await TripServices.createTripIntoDB(req);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Trip created successfully',
    data: result,
  });
});
const getSingleTrip = catchAsync(async (req: Request, res: Response) => {
  const result = await TripServices.getSingleTripFromDB(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Trip retrieved successfully',
    data: result,
  });
});
const getAllTrips = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, tripFilterableFields);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const result = await TripServices.getAllTripsFromDB(filters, options);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Trips retrieved successfully',
    data: result,
  });
});

const updateTrip = catchAsync(async (req: Request, res: Response) => {
  const result = await TripServices.updateTripIntoDB(req.body, req.params.id, req);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Trip updated successfully',
    data: result,
  });
});

const deleteTrip = catchAsync(async (req: Request, res: Response) => {
  const result = await TripServices.deleteTripFromDB(req.params.id, req.user as IAuthUser);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Trip deleted successfully',
    data: result,
  });
});

export const TripControllers = {
  createTrip,
  getSingleTrip,
  getAllTrips,
  updateTrip,
  deleteTrip,
};
