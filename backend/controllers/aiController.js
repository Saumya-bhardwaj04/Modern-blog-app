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
        type: "DAILY_LIMIT",
      });
      // return res.status(429).json({
      //   success: false,
      //   message: "Too many requests 🫨 Please wait a minute",
      //   type: "RATE_LIMIT",
      // });
    }

    // increment
    user.aiUsage.count += 1;
    user.aiUsage.lastUsed = new Date();
    await user.save();

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

    // ---------------- PARSING ----------------
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    let description = "";
    let tags = [];
    let contentLines = [];

    let section = "";

    for (let line of lines) {
      if (line.toLowerCase().includes("description")) {
        section = "description";
        continue;
      }
      if (line.toLowerCase().includes("tag")) {
        section = "tags";
        continue;
      }
      if (line.toLowerCase().includes("content")) {
        section = "content";
        continue;
      }

      if (section === "description") description += line + " ";
      if (section === "tags") tags.push(...line.split(","));
      if (section === "content") contentLines.push(line);
    }

    description = description.trim();
    tags = [...new Set(tags.map(t => t.trim().toLowerCase()))].slice(0, 7);

    // -------- CONVERT TO EDITORJS BLOCKS --------
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

    return res.status(200).json({
      success: true,
      data: {
        description,
        tags,
        content: { blocks },
      },
    });

  } catch (err) {
    console.error("Gemini AI Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "AI assist failed",
    });
  }
};