// src/utils/generateCode.ts

import { db } from "../models/db";
import { students } from "../models/schema";
import { eq } from "drizzle-orm";

export const generateUniqueStudentCode = async (): Promise<string> => {
  // أحرف وأرقام بدون O, 0, I, 1 عشان ما يتلخبطوش
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  
  let code: string = "";
  let isUnique = false;
  
  while (!isUnique) {
    code = "";
    for (let i = 0; i < 5; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    const [existing] = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.code, code))
      .limit(1);
    
    if (!existing) {
      isUnique = true;
    }
  }
  
  return code;
};
