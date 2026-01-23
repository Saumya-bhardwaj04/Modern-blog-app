const admin = require("firebase-admin");

async function sendPush(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) {
    console.log("No tokens provided → skipping push");
    return { successCount: 0, failureCount: 0 };
  }

  // Convert everything to string (FCM data payload requires string values)
  const safeData = Object.fromEntries(
    Object.entries({
      title,
      body,
      ...data,
    }).map(([k, v]) => [k, String(v)])
  );

  // Optional: Add webpush config for better control over web notifications
  // (icon, badge, link on click, etc.)
  const message = {
    tokens,                    // array, max 500
    data: safeData,
    webpush: {
      notification: {
        title,               // optional – FCM can use this if no SW handler, but we rely on SW
        body,
        icon: "/badge.png",   // your app icon (place in public/)
        badge: "/badge.png",     // optional small badge
        // vibrate: [200, 100, 200],
      },
      fcm_options: {
        // Deep link when user clicks the notification
        link: data.click_action || data.url || "/notifications", 
      },
      headers: {
        // Optional: urgency for delivery priority (high for likes/comments)
        Urgency: "high",
      },
    },
  };

  try {
    const batchResponse = await admin.messaging().sendEachForMulticast(message);

    console.log(
      `Push sent → Success: ${batchResponse.successCount}, Failures: ${batchResponse.failureCount}`
    );

    // Important: Clean up invalid/expired tokens
    const failedTokens = [];
    batchResponse.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const error = resp.error;
        const token = tokens[idx];

        console.warn(`Token failed: ${token} → ${error?.code} - ${error?.message}`);

        if (
          error?.code === "messaging/registration-token-not-registered" ||
          error?.code === "messaging/invalid-registration-token" ||
          error?.code === "messaging/registration-token-unsupported"
        ) {
          failedTokens.push(token);
        }
      }
    });

    // Return useful info (you can await removeInvalidTokens(failedTokens) in caller)
    return {
      successCount: batchResponse.successCount,
      failureCount: batchResponse.failureCount,
      failedTokens,
    };
    
  } catch (err) {
    console.error("Push multicast failed completely:", err.message || err);
    // Could throw or return { error: err } depending on your needs
    return { successCount: 0, failureCount: tokens.length, error: err.message };
  }
}

module.exports = sendPush;