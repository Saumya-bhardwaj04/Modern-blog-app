const admin = require("firebase-admin");

async function sendPush(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) {
    console.log("No tokens provided → skipping push");
    return { successCount: 0, failureCount: 0 };
  }

  // 🔥 Remove undefined / null values and force string
  const safeData = Object.fromEntries(
    Object.entries(data)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  );

  const message = {
    tokens,
    data: safeData,
    webpush: {
      fcm_options: {
        link: data.blogSlug
          ? `/blog/${data.blogSlug}`
          : data.username
          ? `/@${data.username}`
          : "/notifications",
      },
      headers: {
        Urgency: "high",
      },
    },
  };

  // 🔍 TEMP DEBUG (remove later)
  console.log("🔥 FCM FINAL PAYLOAD:", JSON.stringify(message, null, 2));

  try {
    const batchResponse = await admin.messaging().sendEachForMulticast(message);

    console.log(
      `Push sent → Success: ${batchResponse.successCount}, Failures: ${batchResponse.failureCount}`
    );

    return {
      successCount: batchResponse.successCount,
      failureCount: batchResponse.failureCount,
    };
  } catch (err) {
    console.error("Push multicast failed:", err);
    return { successCount: 0, failureCount: tokens.length };
  }
}

module.exports = sendPush;
