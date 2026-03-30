import { io } from "socket.io-client";

export const socket = io("https://isonga-backend.onrender.com", {
  withCredentials: false,
  transports: ["polling", "websocket"],
  autoConnect: false,
});