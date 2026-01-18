"use strict";
// src/utils/generateCode.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueStudentCode = void 0;
const db_1 = require("../models/db");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const generateUniqueStudentCode = async () => {
    // أحرف وأرقام بدون O, 0, I, 1 عشان ما يتلخبطوش
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    let isUnique = false;
    while (!isUnique) {
        code = "";
        for (let i = 0; i < 5; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        const [existing] = await db_1.db
            .select({ id: schema_1.students.id })
            .from(schema_1.students)
            .where((0, drizzle_orm_1.eq)(schema_1.students.code, code))
            .limit(1);
        if (!existing) {
            isUnique = true;
        }
    }
    return code;
};
exports.generateUniqueStudentCode = generateUniqueStudentCode;
