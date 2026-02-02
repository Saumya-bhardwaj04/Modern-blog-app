const axios = require("axios");

exports.aiBlogAssist = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.length < 50) {
      return res.status(400).json({
        success: false,
        message: "Not enough content for AI assistance",
      });
    }

    const prompt = `
Generate:
Title:
Description (2-3 lines):
Tags (comma separated):

Content:
${content}
`;

    try {
      // 🔥 Try Hugging Face first
      const response = await axios.post(
        "https://api-inference.huggingface.co/models/google/flan-t5-small",
        { inputs: prompt },
        {
          headers: {
            Authorization: `Bearer ${process.env.HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 25000,
        }
      );

      const text =
        response.data?.[0]?.generated_text ||
        response.data?.generated_text;

      if (text) {
        return res.status(200).json({
          success: true,
          source: "ai",
          result: text,
        });
      }
    } catch (aiError) {
      console.warn("⚠️ HF unavailable, using fallback");
    }

    // 🟡 FALLBACK (DEMO SAFE)
    const fallback = `
Title: ${content.split(" ").slice(0, 6).join(" ")}...
Description: This blog discusses ${content.split(" ").slice(0, 12).join(" ")} in a concise and engaging way.
Tags: blog, writing, content, technology, ai
`;

    return res.status(200).json({
      success: true,
      source: "fallback",
      result: fallback,
    });

  } catch (error) {
    console.error("AI Assist Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "AI assistance failed",
    });
  }
};
