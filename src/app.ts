import express, { Application, Request, Response, NextFunction } from "express";
import logger from "morgan";
import cors from "cors";
import contactsRouter from "./routes/contactsRouter.js";
import authRouter from "./routes/authRouter";
import swaggerUi from "swagger-ui-express";
import swaggerDoc from "./swagger.json";

const app: Application = express();
const formatsLogger: string =
  app.get("env") === "development" ? "dev" : "short";

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use("/api/users", authRouter);
app.use("/api/contacts", contactsRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    code: 404,
    message: "Use api on routes: /api/contacts or /api/users",
    data: "Not found such route",
  });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const { status = 500, message = "Internal Server error" } = err;
  res.status(status).json({ message });
});

export default app;
