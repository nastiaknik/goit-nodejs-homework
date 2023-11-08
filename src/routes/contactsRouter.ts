import express from "express";
import { contactControllers } from "../controllers/contacts";
import validateBody from "../middlewares/validateBody";
import isValidId from "../middlewares/isValidId";
import authenticate from "../middlewares/authenticate";
import {
  contactAddSchema,
  contactUpdateSchema,
  contactUpdateFavoriteSchema,
} from "../schemas/contactsSchemas";
const {
  getAllContacts,
  addContact,
  updateContact,
  removeContact,
  updateFavorite,
} = contactControllers;

const router = express.Router();

router.use(authenticate);

router.get("/", getAllContacts);

router.post("/", validateBody(contactAddSchema), addContact);

router.put("/:id", isValidId, validateBody(contactUpdateSchema), updateContact);

router.delete("/:id", isValidId, removeContact);

router.patch(
  "/:id/favorite",
  isValidId,
  validateBody(contactUpdateFavoriteSchema),
  updateFavorite
);

export default router;
