import io from "socket.io-client";

const socket = io("http://65.2.121.33.nip.io:5500", {
  transports: ["websocket"], // Force WebSocket transport
});

socket.on("connect", () => {
  console.log("Socket connected");
});
socket.on("server_message", (message) => {
  console.log(message, "server message");
});
// Handle connection errors
socket.on("connect_error", (err) => {
  console.error("Connection error:", err);
  // return toastWarn("Network Error")
});
// Handle connection timeout
socket.on("connect_timeout", () => {
  console.warn("Connection timed out");
});
// Handle reconnecting
socket.on("reconnecting", (attemptNumber) => {
  console.log(`Reconnecting... Attempt ${attemptNumber}`);
});
// Handle successful reconnection
socket.on("reconnect", (attemptNumber) => {
  console.log(`Reconnected after ${attemptNumber} attempts`);
});
// Handle reconnection error
socket.on("reconnect_error", (err) => {
  console.error("Reconnection error:", err.message);
});
// Handle failed reconnection attempts
socket.on("reconnect_failed", () => {
  console.error("Reconnection failed");
});

// Listen for the 'disconnect' event
socket.on("disconnect", () => {
  console.log("Socket disconnected");
});

export default socket;
