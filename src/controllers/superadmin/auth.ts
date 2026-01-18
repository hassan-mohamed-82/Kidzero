import { Request, Response } from "express";
import { db } from "../../models/db";
import { UnauthorizedError } from "../../Errors";
import {SuccessResponse} from "../../utils/response";
import { eq } from "drizzle-orm";
import { generateSuperAdminToken } from "../../utils/auth";
import { superAdmins } from "../../models/superadmin/superadmin";
import bcrypt from "bcrypt";

export async function login(req: Request, res: Response) {
  const data = req.body;

  const SuperAdmin = await db.query.superAdmins.findFirst({
    where: eq(superAdmins.email, data.email),
  });

  if (!SuperAdmin) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const match = await bcrypt.compare(data.password, SuperAdmin.passwordHashed);
  if (!match) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = generateSuperAdminToken({
    id: SuperAdmin.id,
    email: SuperAdmin.email,
    name: SuperAdmin.name,
  });

  SuccessResponse(res, { message: "login Successful", token: token ,
    superAdmin: {
      id: SuperAdmin.id,
      name: SuperAdmin.name,
      email: SuperAdmin.email,
      role: "superadmin",
  
    }
  }, 200);
}