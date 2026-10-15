import mongoose from "mongoose";

const tipSchema = new mongoose.Schema(
  {
    // Transaction hash of the on-chain tip() call (lowercase hex)
    txHash: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    // Tipping address (lowercase)
    from: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    // Tip amount in wei, stored as a decimal string (can exceed 2^53)
    amount: {
      type: String,
      required: true,
    },
    // Block timestamp of the tip
    timestamp: {
      type: Date,
      required: true,
    },
    blockNumber: {
      type: Number,
    },
    // Optional off-chain metadata supplied by the tipper after the tx
    name: {
      type: String,
      trim: true,
      maxlength: 40,
      default: "Anonymous",
    },
    message: {
      type: String,
      trim: true,
      maxlength: 280,
      default: "",
    },
    // True once the tip has been observed on-chain (receipt or indexer)
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

tipSchema.index({ timestamp: -1 });

export const Tip = mongoose.model("Tip", tipSchema);
