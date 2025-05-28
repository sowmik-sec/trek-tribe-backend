import express from 'express';
import { UserRoutes } from '../modules/user/user.route';
import { AuthRoutes } from '../modules/auth/auth.route';
import { TripRoutes } from '../modules/trip/trip.route';
import { TravelBuddyRequestRoutes } from '../modules/travelBuddyRequest/travelBuddyRequest.route';
const router = express.Router();

const moduleRoutes = [
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/trips',
    route: TripRoutes,
  },
  {
    path: '/travel-buddies',
    route: TravelBuddyRequestRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
