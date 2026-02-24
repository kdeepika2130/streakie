import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import MissedStreak from '../models/missedStreak.js';
import Habit from '../models/habit.js';
import genAI from '../services/aiClients.js';
import { getEmotionType, generateEmotionalPrompt } from '../services/emotionalEngine.js';

// Generate a contextual AI reply using Gemini AI based on user's explanation
async function generateMotivation(reason, habit, user = {}) {
  const cleaned = (reason || '').trim();
  // If no reason is provided, we cannot generate a message.
  if (!cleaned) {
    return "A reason is required to generate a motivational message.";
  }

  // --- Use Google Gemini API ---
  try {
    if (!genAI) {
      throw new Error("Gemini AI client is not initialized due to a missing API key.");
    }

    console.log("Attempting to generate motivation with Gemini...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const streak = habit && habit.streak ? habit.streak : 0;
    const longestStreak = habit && habit.longestStreak ? habit.longestStreak : 0;

    // Determine emotion type
    const emotionType = getEmotionType(streak, true);

    // Generate system prompt
    const systemPrompt = generateEmotionalPrompt(
      habit ? habit.name : '',
      streak,
      longestStreak,
      reason,
      emotionType
    );

    const userPrompt = `I missed my streak because: '${reason}'. Please help me!`;

    const result = await model.generateContent([systemPrompt, userPrompt]);
    const geminiReply = result.response.text().trim();

    if (geminiReply) {
      console.log("Successfully generated motivation with Gemini.");
      return { reply: geminiReply, valid: true }; // Extracting logic later
    }

    throw new Error("Gemini returned an empty response.");
  } catch (aiError) {
    console.error(`AI Error: Gemini failed. ${aiError.message}`);

    if (aiError.message && aiError.message.includes("API key not valid")) {
      return { reply: "AI Error: The Gemini API key is invalid or missing. Please check the server configuration.", valid: false };
    }

    return { reply: "I'm having a little trouble thinking of the right words. Just remember that every day is a new opportunity to succeed!", valid: true };
  }
}

// Generate whether a reason is valid using Gemini AI
async function validateReasonWithAI(reason) {
  try {
    if (!genAI) return true; // Default to true if AI is disabled

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Evaluate the following reason for missing a habit streak: "${reason}".
    Is this a valid, understandable reason (e.g., sickness, emergency, genuine forgetfulness) OR is it a terrible, repeated excuse (e.g., "I was too lazy", "I just didn't want to")?
    Respond ONLY with a JSON object: {"valid": true|false}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(text);
      return parsed.valid !== false;
    } catch {
      return true; // default to true on parse error
    }
  } catch (err) {
    console.error("Failed to validate reason with AI", err);
    return true;
  }
}

// Save missed streak with AI reply
const saveMotivation = async (req, res) => {
  try {
    const { habitId, userExplanation } = req.body;
    if (!habitId || !userExplanation) return res.status(400).json({ success: false, message: 'Habit and reason required.' });
    const habit = await Habit.findById(habitId);
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });
    // prevent duplicate submission for same habit within 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await MissedStreak.findOne({
      user: req.user.id,
      habitId,
      date: { $gte: since }
    });
    if (existing) {
      // generate a fresh ai reply but do not save it
      const freshReply = await generateMotivation(userExplanation, habit, req.user || {});
      const isValid = await validateReasonWithAI(userExplanation);
      const isErrorMessage = freshReply.reply && freshReply.reply.startsWith("AI Error:");
      const showRestoreButton = !isErrorMessage && isValid;

      return res.json({
        success: true,
        entry: existing,
        aiReply: freshReply.reply,
        showRestoreButton: showRestoreButton
      });
    }

    // generate an AI reply (may call OpenAI or fallback templates)
    const aiResponse = await generateMotivation(userExplanation, habit, req.user || {});
    const isValid = await validateReasonWithAI(userExplanation);

    // Check past history for repeated invalid reasons
    const recentMisses = await MissedStreak.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(3);

    let showRestoreButton = isValid;
    if (!isValid) {
      const invalidCount = recentMisses.filter(m => m.validReason === false).length;
      if (invalidCount >= 2) {
        showRestoreButton = false;
      } else {
        // If it's their first or second invalid excuse, still give them a pass but mark as invalid in DB
        showRestoreButton = true;
      }
    }

    const isErrorMessage = aiResponse.reply && aiResponse.reply.startsWith("AI Error:");
    if (isErrorMessage) showRestoreButton = false;

    // Save only the user's reason to history
    const entry = new MissedStreak({
      user: req.user.id,
      habitId,
      habitName: habit.name,
      userExplanation,
      validReason: isValid
    });
    await entry.save();
    res.json({ success: true, entry, aiReply: aiResponse.reply, showRestoreButton });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get motivation history for user
const getMotivationHistory = async (req, res) => {
  try {
    const history = await MissedStreak.find({ user: req.user.id }).sort({ date: -1 });
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const router = express.Router();
router.post('/missed', authMiddleware, saveMotivation);
router.get('/history', authMiddleware, getMotivationHistory);

export default router;
