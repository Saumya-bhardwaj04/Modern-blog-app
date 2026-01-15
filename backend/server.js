const express = require("express");
const cors = require("cors");
const dbConnect = require("./config/dbConnect")
const userRoute = require("./routes/userRoutes");
const blogRoute = require("./routes/blogRoutes");
const cloudinaryConfig = require("./config/cloudinaryConfig");
const { PORT, FRONTEND_URL } = require("./config/dotenv.config");
const app = express();

const port = PORT || 5000;

app.use(express.json());
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.get("/", (req, res) => {
    res.send("Backend is running");
});
app.options("*", cors());
app.use("/api/v1", userRoute);
app.use("/api/v1", blogRoute);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    dbConnect();
    cloudinaryConfig();
})