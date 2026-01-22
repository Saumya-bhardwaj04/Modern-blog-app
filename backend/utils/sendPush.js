const admin = require("firebase-admin");

async function sendPush(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) return;

  try {
    const safeData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    );

    await admin.messaging().sendEachForMulticast({
      tokens,

      notification: {
        title,
        body,
        icon: "https://meloque.me/logo.png", 
        image: data.image || undefined,     
      },

      data: {
        ...safeData,
        click_action: "FLUTTER_NOTIFICATION_CLICK", 
      },
    });
  } catch (err) {
    console.error("Push error:", err.message);
  }
}

module.exports = sendPush;
