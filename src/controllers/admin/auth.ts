import { Request, Response } from "express";
import { db } from "../../models/db";
import { admins } from "../../models/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { generateToken } from "../../utils/auth";
import { UnauthorizedError } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
export async function login(req: Request, res: Response) {
  const data = req.body;

  const admin = await db.query.admins.findFirst({
    where: eq(admins.email, data.email),
  });

  if (!admin) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const match = await bcrypt.compare(data.password, admin.hashedPassword);
  if (!match) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = generateToken({
    id: admin.id,
    name: admin.name,
    role: "admin",
  });

  SuccessResponse(res, { message: "login Successful", token: token }, 200);
}
