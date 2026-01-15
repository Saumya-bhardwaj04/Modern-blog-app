const { Resend } = require("resend");
const {RESEND_API_KEY} = require("../config/dotenv.config");
const resend = new Resend(RESEND_API_KEY);

async function sendEmail({ to, subject, html }) {
  return resend.emails.send({
    from: "Meloque <onboarding@resend.dev>",
    to,
    subject,
    html,
  });
}

module.exports = sendEmail;
