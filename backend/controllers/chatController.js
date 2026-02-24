// backend/controllers/chatController.js
import Chat from "../models/Chat.js";
import Habit from "../models/habit.js";
import genAI from "../services/aiClients.js";

// Send Message
export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    let aiReply = "I am StreakBuddy! How can I help you today?";
    let tone = "neutral";

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Retrieve the last 5 chat messages for context
        const recentChats = await Chat.find({ user: userId })
          .sort({ createdAt: -1 })
          .limit(5);
        const chatHistory = recentChats.reverse().map(c => `User: "${c.message}" | You: "${c.response}"`).join("\n");

        // Retrieve the user's active habits and streaks
        const userHabits = await Habit.find({ user: userId });
        const habitsContext = userHabits.length > 0
          ? userHabits.map(h => `- ${h.name} (Streak: ${h.streak}, Status: ${h.status})`).join("\n")
          : "The user has no habits tracked yet.";

        const systemPrompt = `You are StreakBuddy 🤖, an emotional, witty, and highly empathetic AI friend inside the Habit Tracker app "StreakMates".
        
        Analyze the user's message and determine their intent. Respond accordingly. 
        - If it's a greeting ("hi", "hello"), be conversational.
        - If they express low mood or sadness, provide emotional support and deep motivation. 
        - If they flirt with you, playfully flirt back. 
        - If they ask for motivation, provide highly tailored advice referencing their habits.
        - Otherwise, answer naturally as a helpful AI habit coach.

        Here is your recent memory of this conversation (Use this for context if the user asks follow-up questions):
        ---
        ${chatHistory || "No previous history."}
        ---

        Here is the user's current habit data (You must reference this if they ask about their streaks):
        ---
        ${habitsContext}
        ---
        
        Keep it strictly under 3 sentences. 
        
        CRITICAL INSTRUCTION: You MUST format your entire response as a JSON string like this:
        {"reply": "your text response here", "tone": "neutral|emotional|flirty"}
        Make sure the format is purely valid JSON without markdown wrapping.`;

        const result = await model.generateContent([systemPrompt, `Current Message -> User says: "${message}"`]);
        const geminiText = result.response.text().trim();

        // Strip markdown backticks if Gemini accidentally adds them
        const cleanedText = geminiText.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
          const parsed = JSON.parse(cleanedText);
          aiReply = parsed.reply || aiReply;
          tone = parsed.tone || tone;
        } catch (parseErr) {
          console.error("Failed to parse Gemini JSON:", cleanedText);
          aiReply = cleanedText;
        }
      } catch (aiErr) {
        console.error("Gemini failed in chatController:", aiErr.message);
      }
    }

    const newChat = await Chat.create({
      user: userId,
      message,
      response: aiReply,
    });

    return res.status(200).json({
      success: true,
      data: newChat,
      reply: aiReply,
      tone: tone
    });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

// Get Chat History
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({ user: userId }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: chats,
    });
  } catch (error) {
    console.error("Get History Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat history",
    });
  }
};

// Clear Chat History
export const clearChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    await Chat.deleteMany({ user: userId });

    res.status(200).json({
      success: true,
      message: "Chat history cleared",
    });
  } catch (error) {
    console.error("Clear History Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear chat history",
    });
  }
};