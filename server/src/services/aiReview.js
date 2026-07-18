import dotenv from "dotenv";

dotenv.config();

async function generateAiReview({ code, staticAnalysis, filename }) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      summary:
        "AI review is unavailable because no OpenRouter API key is configured.",
      suggestions: [
        "Add OPENROUTER_API_KEY to your environment to enable AI-powered review.",
      ],
      confidence: "low",
      fallback: true,
    };
  }

  const prompt = `You are an expert Principal software engineer reviewing code.\n\nReturn a concise, polished review that looks very beautiful to user with perfect alignments as you are writing it on notepad so make it clean, and explain it very simply with clear explanation so that anyone can understand easily, and if the code is wrong always give the corrected code block, and review it in this format:\n1. Outcome: 1 short  and onpoint sentence\n2. Key issues: 2 to 3 short bullets\n3. Recommended fix: 1 short bullet\n4. Confidence: low / medium / high\n\nKeep the response short, practical, and easy to scan.\n\nStatic analysis context:\n${JSON.stringify(staticAnalysis, null, 2)}\n\nCode:\n${code}\n\nFilename: ${filename}`;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a senior software engineer and code reviewer.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`AI review failed with status ${response.status}`);
  }

  const data = await response.json();
  const content =
    data?.choices?.[0]?.message?.content || "No AI response received.";

  return {
    summary: content,
    suggestions: [
      "Review the AI response for implementation quality.",
      "Cross-check the result with your own architecture requirements.",
    ],
    confidence: "medium",
    fallback: false,
  };
}

export { generateAiReview };
