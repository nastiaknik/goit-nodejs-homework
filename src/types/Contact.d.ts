import { Types, Document } from "mongoose";

interface IContact extends Document {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  favorite: boolean;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export { IContact };
