import ChatHistory from '../models/ChatHistory.js';
import User from '../models/User.js';

import { generateReply } from '../services/grokService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError, ApiResponse } from '../utils/sendResponse&Error.js';
import { getIO } from "../config/socket.js";



export const sendMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;

  const userId = req.user._id;
  if (!message?.trim()) {
    throw new ApiError(400, "Message is required");
  }

  let chatHistory = await ChatHistory.findOne({
    user: userId,
  });

  const oldMessages = chatHistory?.messages || [];


  // recent context for AI
  const recentMessages = oldMessages.slice(-10);


  // add current user message
  recentMessages.push({
    role: "user",
    content: message,
  });


  // generate AI response
  const aiReply = await generateReply(recentMessages);


  // create messages
  const userMessage = {
    role: "user",
    content: message,
  };

  const assistantMessage = {
    role: "assistant",
    content: aiReply,
  };


  // save in db
  if (!chatHistory) {

    chatHistory = await ChatHistory.create({
      user: userId,
      messages: [userMessage, assistantMessage],
    });

  } else {

    chatHistory.messages.push(
      userMessage,
      assistantMessage
    );

    await chatHistory.save();
  }


  // realtime socket emit
  const io = getIO();

  io.emit("receive_message", {
    message: aiReply,
  });


  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reply: aiReply,
      },
      "Reply generated successfully"
    )
  );
});