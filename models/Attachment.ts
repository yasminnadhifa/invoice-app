import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAttachment extends Document {
  filename: string;
  originalName: string;
  fileUrl: string;
  entityType: "receipt" | "invoice";
  entityId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    entityType: { type: String, enum: ["receipt", "invoice"], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const Attachment: Model<IAttachment> =
  mongoose.models.Attachment ||
  mongoose.model<IAttachment>("Attachment", attachmentSchema);

export default Attachment;