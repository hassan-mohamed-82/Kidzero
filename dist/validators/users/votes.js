"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitVoteSchema = void 0;
const zod_1 = require("zod");
exports.submitVoteSchema = zod_1.z.object({
    body: zod_1.z.object({
        items: zod_1.z.array(zod_1.z.string()).min(1, "At least one item must be selected"),
    }),
});
