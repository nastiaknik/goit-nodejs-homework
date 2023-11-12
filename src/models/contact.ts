import { Schema, model } from "mongoose";
import handleMongooseError from "../helpers/handleMongooseError";
import { IContact } from "src/types/Contact";

const contactSchema = new Schema<IContact>(
  {
    name: {
      type: String,
      required: [true, "Set name for contact"],
    },
    phone: {
      type: String,
      required: true,
      match: /^(\+?\d{1,3}[- ]?)?\d{10}$/,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { versionKey: false, timestamps: true }
);

contactSchema.post<IContact>("save", handleMongooseError);

const Contact = model<IContact>("contact", contactSchema);

export default Contact;
