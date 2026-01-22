const admin = require("firebase-admin");

async function sendPush(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) return;

  try {
    const safeData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    );

    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: safeData,
    });
    
  } catch (err) {
    console.error("Push error:", err.message);
  }
}

module.exports = sendPush;