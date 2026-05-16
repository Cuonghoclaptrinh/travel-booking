import { io } from 'socket.io-client';
const SOCKET_URL = import.meta.env.VITE_API_URL;

export const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    withCredentials: true,
    autoConnect: true,
});

socket.on("connect", () => {
    console.log("SOCKET CONNECTED", socket.id);
});

socket.on("disconnect", (reason) => {
    console.log("SOCKET DISCONNECTED", reason);
});

socket.on("connect_error", (error) => {
    console.log("SOCKET CONNECT ERROR", error.message);
});