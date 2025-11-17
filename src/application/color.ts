import { Request, Response, NextFunction } from "express";
import Color from "../infrastructure/db/entities/Color";

// Get all colors
const getAllColors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const colors = await Color.find();
        res.json(colors);
    } catch (error) {
        next(error);
    }
};

export { getAllColors };
