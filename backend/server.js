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
}));
app.get("/", (req, res) => {
  res.send("Backend is running");
});
app.use("/api/v1", userRoute);
app.use("/api/v1", blogRoute);

app.listen(port, () => {
    console.log("server running on port 3000");
    dbConnect();
    cloudinaryConfig();
})