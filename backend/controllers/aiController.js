const natural = require("natural");
const stopword = require("stopword");

exports.aiBlogAssist = async (req, res) => {
  try {
    let { content } = req.body;

    if (!content || content.length < 50) {
      return res.status(400).json({
        success: false,
        message: "Not enough content for AI assistance",
      });
    }

    /* =========================
       1. HARD CLEAN (HTML + SPAM)
    ========================= */

    const cleanText = (text) => {
      return text
        // Remove HTML tags (<mark>, <b>, etc.)
        .replace(/<[^>]*>/g, " ")
        // Decode &nbsp; and similar
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        // Kill spam letters (hhhhhh → hhh)
        .replace(/(.)\1{3,}/g, "$1$1$1")
        // Remove junk symbols
        .replace(/[^a-zA-Z0-9.\s]/g, " ")
        // Normalize spaces
        .replace(/\s+/g, " ")
        .trim();
    };

    const cleanedText = cleanText(content);

    /* =========================
       2. SENTENCE EXTRACTION
    ========================= */

    const sentences = cleanedText
      .split(/[.!?]/)
      .map(s => s.trim())
      .filter(s => s.length > 15);

    const uniqueSentences = [...new Set(sentences)];

    /* =========================
       3. TITLE GENERATION
       (CAPITAL + SAFE)
    ========================= */

    let title = uniqueSentences[0] || "Untitled Blog Post";

    title = title
      .slice(0, 50)              // Length control
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();            // ✅ REQUIRED

    if (!/[A-Z]{3,}/.test(title)) {
      title = "UNTITLED BLOG POST";
    }

    /* =========================
       4. DESCRIPTION (2–3 lines)
    ========================= */

    let description = uniqueSentences.slice(0, 2).join(". ");

    description = description
      .replace(/\s+/g, " ")
      .trim();

    if (description.length > 180) {
      description = description.slice(0, 180) + "...";
    }

    /* =========================
       5. TAG GENERATION (NLP)
    ========================= */

    const STOP_WORDS = new Set([
      "the","is","am","are","was","were","and","or","to","of","in","on",
      "for","with","this","that","it","my","name","a","an",
      "paragraph","sentences","english","nbsp","mark"
    ]);

    const words = cleanedText
      .toLowerCase()
      .split(" ")
      .filter(w => w.length > 3 && !STOP_WORDS.has(w));

    const freq = {};
    words.forEach(w => freq[w] = (freq[w] || 0) + 1);

    const tags = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([word]) => word);

    /* =========================
       6. FINAL RESPONSE
    ========================= */

    return res.status(200).json({
      success: true,
      source: "rule-based-nlp",
      data: {
        title,
        description,
        tags,
      },
    });

  } catch (error) {
    console.error("AI Assist Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "AI assistance failed",
    });
  }
};