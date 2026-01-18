const express = require("express");
const cors = require("cors");
const dbConnect = require("./config/dbConnect")
const userRoute = require("./routes/userRoutes");
const blogRoute = require("./routes/blogRoutes");
const cloudinaryConfig = require("./config/cloudinaryConfig");
const { PORT, ALLOWED_ORIGINS } = require("./config/dotenv.config");
const app = express();

const port = PORT || 5000;

app.use(express.json());

const allowedOrigins = ALLOWED_ORIGINS
  ? ALLOWED_ORIGINS.split(",")
  : [];

app.use(
  cors({
    origin: allowedOrigins,
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
// (health check / warm-up)
app.get("/ping", (req, res) => {
    res.send("ok");
});
app.use("/api/v1", userRoute);
app.use("/api/v1", blogRoute);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    dbConnect();
    cloudinaryConfig();
})