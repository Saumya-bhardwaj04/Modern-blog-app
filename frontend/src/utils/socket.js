import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ["websocket"],
  withCredentials: true,
  autoConnect: false,
});

export default socket;
