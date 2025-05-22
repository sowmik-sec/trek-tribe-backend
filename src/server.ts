import { Server } from 'http';
import app from './app';

async function main() {
  const server: Server = app.listen(5000, () => {
    console.log(`Server is running on port 5000`);
  });
  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.log('Server Closed');
      });
    }
    process.exit(1);
  };
  const unexpectedErrorHandler = (error: unknown) => {
    console.log(error);
    exitHandler();
  };
  process.on('uncaughtException', unexpectedErrorHandler);
  process.on('unhandledRejection', unexpectedErrorHandler);
}

main();
