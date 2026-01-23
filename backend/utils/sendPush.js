const admin = require("firebase-admin");

async function sendPush(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) return;

  try {
    const safeData = {};
    Object.entries(data).forEach(([k, v]) => {
      safeData[k] = String(v);
    });

    await admin.messaging().sendEachForMulticast({
      tokens,
      data: {
        title: String(title),
        body: String(body),
        ...safeData,
      },
    });
  } catch (err) {
    console.error("Push error:", err.message);
  }
}

module.exports = sendPush;