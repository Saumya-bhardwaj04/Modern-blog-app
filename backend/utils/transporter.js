const nodemailer = require("nodemailer");
const { EMAIL_USER, EMAIL_PASS } = require("../config/dotenv.config");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS, 
  },
});
transporter.verify((error, success) => {
    if (error) {
        console.error("Email transporter error:", error);
    } else {
        console.log("Email transporter ready");
    }
});
module.exports = transporter;