import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { StatusCodes } from 'http-status-codes';
import router from './app/routes';
const app: Application = express();

app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/test', (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    message: 'Server working',
  });
});

app.use('/api/v1', router);

export default app;
