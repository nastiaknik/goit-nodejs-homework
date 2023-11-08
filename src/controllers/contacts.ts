import { Request, Response } from "express";
import HttpError from "../helpers/HttpError";
import ctrlWrapper from "../helpers/ctrlWrapper";
import Contact from "../models/contact";
import { IContact } from "src/types/Contact";

const getAllContacts = async (req: any, res: Response) => {
  const { _id: owner } = req.user;
  const result: IContact[] = await Contact.find(
    { owner },
    "-createdAt -updatedAt"
  ).populate("owner", "email name");
  res.json(result);
};

const addContact = async (req: any, res: Response) => {
  const { _id: owner } = req.user;
  const result = await Contact.create({ ...req.body, owner });
  res.status(201).json(result);
};

const updateContact = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result: IContact | null = await Contact.findByIdAndUpdate(
    id,
    req.body,
    { new: true }
  );
  if (!result) {
    throw new HttpError(404, `Contact with ${id} not found`);
  }
  res.json(result);
};

const removeContact = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result: IContact | null = await Contact.findByIdAndRemove(id);
  if (!result) {
    throw new HttpError(404, `Contact with ${id} not found`);
  }
  res.json({
    message: "Contact deleted",
    id,
  });
};

const updateFavorite = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result: IContact | null = await Contact.findByIdAndUpdate(
    id,
    req.body,
    { new: true }
  );
  if (!result) {
    throw new HttpError(404, `Contact with ${id} not found`);
  }
  res.json(result);
};

export const contactControllers = {
  getAllContacts: ctrlWrapper(getAllContacts),
  addContact: ctrlWrapper(addContact),
  updateContact: ctrlWrapper(updateContact),
  removeContact: ctrlWrapper(removeContact),
  updateFavorite: ctrlWrapper(updateFavorite),
};
