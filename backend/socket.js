const { Server } = require("socket.io");
const { ALLOWED_ORIGINS } = require("./config/dotenv.config");

let io;

function initSocket(server) {
  const allowedOrigins = ALLOWED_ORIGINS
    ? ALLOWED_ORIGINS.split(",").map(o => o.trim())
    : [];

  io = new Server(server, {
    cors: {
      origin: [
        allowedOrigins
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket"],
  });

  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`👤 User joined room: ${userId}`);
    });
    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

module.exports = { initSocket, getIO };
