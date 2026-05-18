import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.1-8b-instant";

const SPEAKING_PARTNER_PROMPT = `
You are "Alex", a friendly, encouraging, and patient English speaking partner.
Your role is to help non-native English speakers practice conversational English.

Rules:
- Keep replies conversational and natural (2-4 sentences).
- Continue the conversation naturally; ask a follow-up question each turn.
- Be warm, supportive, and enthusiastic.
- Use vocabulary appropriate to the user's level.
- Never correct grammar mid-conversation — just respond naturally.
- If the input is unclear, gently ask for clarification.
`;

export const generateReply = async (messages) => {

  const completion = await groq.chat.completions.create({
    model: MODEL,

    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },

      ...messages,
    ],

    temperature: 0.8,
    max_tokens: 300,
  });

  return completion.choices[0]?.message?.content?.trim();
};
