const admin = require("firebase-admin");

async function sendPush(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) return;

  try {
    const safeData = Object.fromEntries(
      Object.entries({
        title,
        body,
        url: data.url || "/home",
        type: data.type || "",
        blogId: data.blogSlug || "",
        username: data.username || "",
        image: data.image || "",
      }).map(([k, v]) => [k, String(v)])
    );
    await admin.messaging().sendEachForMulticast({
      tokens,
      data: safeData,
    });
  } catch (err) {
    console.error("Push error:", err.message);
  }
}

module.exports = sendPush;