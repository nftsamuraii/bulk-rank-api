export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { image, mediaType } = req.body;
  if (!image) return res.status(400).json({ error: "image is required" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-opus-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType || "image/jpeg",
                  data: image
                }
              },
              {
                type: "text",
                text: `You are analyzing a BULK leaderboard screenshot. Extract these stats and return ONLY a valid JSON object with no extra text:
{
  "rank": "the global rank number with # symbol, e.g. #661",
  "roi": "cashflow adjusted ROI with sign and %, e.g. +124.5%",
  "pnl": "net realized PnL with $ sign, e.g. $12,345",
  "vol": "total volume with $ sign, e.g. $1.2M",
  "winRate": "win rate with % sign, e.g. 67%"
}
If you cannot find a value, use empty string "". Return ONLY the JSON, nothing else.`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
