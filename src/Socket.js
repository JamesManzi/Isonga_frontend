// socket.js
import { io } from "socket.io-client";

export const socket = io("https://api.isongamarket.com", {
  transports: ["polling", "websocket"],
  autoConnect: true,
});