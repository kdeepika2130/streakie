import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  circleId: { type: mongoose.Schema.Types.ObjectId, ref: "Circle", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String },
  image: { type: String }, // optional
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);
