"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.participateCompetitionSchema = void 0;
const zod_1 = require("zod");
exports.participateCompetitionSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Name is required"),
        dateOfBirth: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid date format",
        }),
        gender: zod_1.z.enum(["male", "female"]),
    }),
});
