import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRequestLog extends Document {
  endpoint: string;
  method: string;
  authType: "jwt" | "api-key" | "anonymous";
  userId?: string;
  payload?: Record<string, unknown>;
  files: { name: string; size: number; mimeType: string }[];
  responseStatus: number;
  createdAt: Date;
}

const requestLogSchema = new Schema<IRequestLog>(
  {
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    authType: { type: String, enum: ["jwt", "api-key", "anonymous"], required: true },
    userId: { type: String },
    payload: { type: Schema.Types.Mixed },
    files: [
      {
        name: { type: String },
        size: { type: Number },
        mimeType: { type: String },
      },
    ],
    responseStatus: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

requestLogSchema.index({ createdAt: -1 });
requestLogSchema.index({ endpoint: 1 });

const RequestLog: Model<IRequestLog> =
  mongoose.models.RequestLog ||
  mongoose.model<IRequestLog>("RequestLog", requestLogSchema);

export default RequestLog;
