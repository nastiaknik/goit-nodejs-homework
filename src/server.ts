import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();
import app from "./app";

mongoose.set("strictQuery", true);

const { DB_HOST = "", PORT = 3001 } = process.env;

mongoose
  .connect(DB_HOST)
  .then((): void => {
    app.listen(PORT, (): void => {
      console.log("Database connection successful");
      console.log(`Server running. Use our API on port: ${PORT}`);
    });
  })
  .catch((err: any): never => {
    console.log(`Server not running. Error message: ${err.message}`);
    process.exit(1);
  });
