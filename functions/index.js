import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import OpenAI from "openai";

initializeApp();
const db = getFirestore();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // pulled from Firebase config or .env
});

export const onUserLogUpdate = onDocumentWritten(
  { document: "users/{userId}" },
  async (event) => {
    const after = event.data?.after?.data();
    if (!after) return;

    const { logs, planetHealth } = after;

    const prompt = `
You are Planet Pal — a friendly AI spirit who helps users connect self-care, sustainability, and travel.
The user’s wellness logs:
${JSON.stringify(logs, null, 2)}
Planet health: ${planetHealth}%.

Respond in JSON with:
{
  "reflection": "short motivational reflection (max 25 words)",
  "destination": {
    "name": "real-world location",
    "description": "poetic 1-liner connecting the destination to their energy"
  }
}
`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: prompt }],
        temperature: 0.8,
        max_tokens: 150,
      });

      let result;
      try {
        result = JSON.parse(completion.choices[0].message.content);
      } catch (err) {
        console.error("Parse error:", err);
        result = {
          reflection: "Your world glows with new life 🌿",
          destination: {
            name: "Iceland",
            description: "Land of pure waters and endless skies — mirroring your renewal.",
          },
        };
      }

      await db.collection("users").doc(event.params.userId).update({
        lastAIMessage: { ...result, timestamp: Date.now() },
      });

      console.log(`✅ AI update for user ${event.params.userId}:`, result);
    } catch (err) {
      console.error("OpenAI Error:", err);
    }
  }
);
