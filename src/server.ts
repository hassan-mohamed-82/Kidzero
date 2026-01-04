import express from "express";
import path from "path";
import ApiRoute from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { NotFound } from "./Errors";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
dotenv.config();

const app = express();
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(cors({ origin: "*" }));
app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.get("/api/test", (req, res, next) => {
  res.json({ message: "API is working! notify token" });
});
app.use("/api", ApiRoute);
app.use((req, res, next) => {
  throw new NotFound("Route not found");
});
app.use(errorHandler);
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000 ");
});
