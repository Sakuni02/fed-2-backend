import mongoose from "mongoose";

const colorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    hex: {
        type: String,
        required: false,
        match: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i,
    },
});

const Color = mongoose.model("Color", colorSchema);

export default Color;
