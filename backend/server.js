const express = require("express");
const cors = require("cors");
const dbConnect = require("./config/dbConnect")
const userRoute = require("./routes/userRoutes");
const blogRoute = require("./routes/blogRoutes");
const cloudinaryConfig = require("./config/cloudinaryConfig");
const { PORT } = require("./config/dotenv.config");
const app = express();

const port = PORT || 5000;

app.use(express.json());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.get("/", (req, res) => {
    res.send("Backend is running");
});
app.use("/api/v1", userRoute);
app.use("/api/v1", blogRoute);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    dbConnect();
    cloudinaryConfig();
})