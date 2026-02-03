const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();
const User = require("../models/userSchema");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

exports.aiBlogAssist = async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.user;

    if (!title || title.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Title must contain at least 5 characters",
      });
    }
    // 🔹 Fetch user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }
    if (!user.aiUsage) {
      user.aiUsage = { count: 0, lastUsed: null };
    }
    // 🔹 Reset AI count daily
    const today = new Date().toDateString();
    const lastUsed = user.aiUsage.lastUsed
      ? new Date(user.aiUsage.lastUsed).toDateString()
      : null;

    if (lastUsed !== today) {
      user.aiUsage.count = 0;
    }
    const MAX_DAILY_LIMIT = 3;

    if (user.aiUsage.count >= MAX_DAILY_LIMIT) {
      return res.status(429).json({
        success: false,
        message: "You have reached the AI limit 😕 Try again tomorrow",
      });
    }
    const prompt = `
From the blog title below, generate:

Description (2–3 lines)
Tags (5–7, comma separated)
Blog content (20–30 lines total)

Rules for content:
- Use headings (##)
- Use bold for key points
- Do NOT use markdown symbols like ** or *
- Keep language simple and readable
- No HTML
- Plain text only
- Use emojies
- Make it engaging and informative


Title:
"${title}"
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const text = response?.candidates?.[0]?.content.parts?.map(p => p.text).join("");
    if (!text) throw new Error("Empty Gemini response");

    // increment
    user.aiUsage.count += 1;
    user.aiUsage.lastUsed = new Date();
    await user.save();

    // ---------------- PARSING ----------------
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    let description = "";
    let tags = [];
    let contentLines = [];

    let section = "";

    for (let line of lines) {
      const lower = line.toLowerCase();

      if (lower.startsWith("description")) {
        section = "description";
        continue;
      }
      if (lower.startsWith("tags")) {
        section = "tags";
        continue;
      }
      if (lower.startsWith("blog") || lower.startsWith("content")) {
        section = "content";
        continue;
      }

      if (section === "description") description += line + " ";
      if (section === "tags") {
        tags.push(
          ...line
            .replace(/[-•]/g, "")
            .split(",")
            .map(t => t.trim())
        );
      }
      if (section === "content") contentLines.push(line);
    }

    tags = [...new Set(tags)].slice(0, 7);

    const blocks = contentLines.map(line => {
      if (line.startsWith("##")) {
        return {
          type: "header",
          data: { text: line.replace("##", "").trim(), level: 3 },
        };
      }
      return {
        type: "paragraph",
        data: { text: line },
      };
    });

    return res.json({
      success: true,
      message: "AI suggestions applied ✨",
      data: {
        description: description.trim(),
        tags,
        content: { blocks },
      },
    });

  } catch (err) {
    console.error("Gemini AI Error:", err.message);
    return res.status(429).json({
      success: false,
      message: "AI service busy 😕 Please try again later",
      type: "RATE_LIMIT",
    });
  }
};