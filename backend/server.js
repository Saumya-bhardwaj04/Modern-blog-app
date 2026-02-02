const express = require("express");
const cors = require("cors");
const dbConnect = require("./config/dbConnect")
require("dotenv").config();
const userRoute = require("./routes/userRoutes");
const blogRoute = require("./routes/blogRoutes");
const aiRoute = require("./routes/aiRoutes");
const cloudinaryConfig = require("./config/cloudinaryConfig");
const { PORT, ALLOWED_ORIGINS } = require("./config/dotenv.config");
const app = express();
const http = require("http");
const { initSocket } = require("./socket");

const server = http.createServer(app);
initSocket(server);

const port = PORT || 5000;

app.use(express.json());

const allowedOrigins = ALLOWED_ORIGINS
  ? ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : [];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        return callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/api/v1", userRoute);
app.use("/api/v1", blogRoute);
app.use("/api/v1/ai", aiRoute);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  dbConnect();
  cloudinaryConfig();
})