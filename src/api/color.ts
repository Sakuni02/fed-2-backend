import express from "express";
import { getAllColors } from "../application/color";

const colorRouter = express.Router();

colorRouter.get("/", getAllColors);

export default colorRouter;
