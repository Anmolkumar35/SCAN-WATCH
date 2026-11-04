import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => {
  if (socket && socket.connected) {
    return socket;
  }

  const token = localStorage.getItem("scane_token") || localStorage.getItem("token") || "";
  const serverUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

  socket = io(serverUrl, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    transports: ["websocket", "polling"],
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};