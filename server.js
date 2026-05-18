import dotenv from 'dotenv';
import http from "http";
import app from './app.js';
import connectDB from './src/config/db.js';
dotenv.config();

import { initSocket } from './src/socket/chat.socket.js';

const startServer = async () => {
  await connectDB();
  const server = http.createServer(app);

  initSocket(server);

  server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
};

startServer();
