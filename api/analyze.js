import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { keywords } = req.body;

  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    return res.status(400).json({ error: "keywords array is required" });
  }

  try {
    const results = [];

    for (const keyword of keywords) {
      const message = await client.messages.create({
        model: "claude-opus-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Analyze the SEO ranking difficulty and search intent for this keyword: "${keyword}".
            
Return a JSON object with these fields:
- keyword: the keyword
- difficulty: number 1-100 (SEO difficulty)
- intent: "informational" | "commercial" | "transactional" | "navigational"
- volume: estimated monthly searches (low/medium/high)
- recommendation: short advice in Ukrainian

Return ONLY the JSON object, no other text.`,
          },
        ],
      });

      const text = message.content[0].text;
      const parsed = JSON.parse(text);
      results.push(parsed);
    }

    return res.status(200).json({ results });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
