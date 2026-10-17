import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    // Transaction hash of the owner-only withdraw() call (lowercase hex)
    txHash: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    // Address that received the sweep (always the contract owner)
    to: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    // Withdrawn amount in wei, stored as a decimal string (can exceed 2^53)
    amount: {
      type: String,
      required: true,
    },
    // Block timestamp of the withdrawal
    timestamp: {
      type: Date,
      required: true,
    },
    blockNumber: {
      type: Number,
    },
  },
  { timestamps: true }
);

withdrawalSchema.index({ timestamp: -1 });

export const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);
