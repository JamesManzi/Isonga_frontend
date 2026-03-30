// socket.js
import { io } from "socket.io-client";

export const socket = io("https://isonga-backend.onrender.com", {
  transports: ["websocket", "polling"],
  autoConnect: true,
});