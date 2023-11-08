import { Types, Document } from "mongoose";

interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  verificationToken?: string | null;
  verify: boolean;
  createdAt: Date;
  updatedAt: Date;
  token?: string | null;
  resetToken?: {
    token: string;
    expiration: Date;
  };
}

export { IUser };
