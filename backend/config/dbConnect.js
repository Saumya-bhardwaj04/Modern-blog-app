const mongoose = require("mongoose");
const { DB_URL } = require("./dotenv.config");

async function dbConnect() {
    try {
        await mongoose.connect(DB_URL);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log("Error connecting to MongoDB", error);
    }
}

module.exports = dbConnect