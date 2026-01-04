// src/utils/auth.ts

import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../Errors";
import { TokenPayload } from "../types/custom";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const generateSuperAdminToken = (data: { id: string; name: string }): string => {
  const payload: TokenPayload = {
    id: data.id,
    name: data.name,
    role: "superadmin",
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const generateOrganizationToken = (data: { id: string; name: string }): string => {
  const payload: TokenPayload = {
    id: data.id,
    name: data.name,
    role: "organization",
    organizationId: data.id,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const generateParentToken = (data: { id: string; name: string; organizationId: string }): string => {
  const payload: TokenPayload = {
    id: data.id,
    name: data.name,
    role: "parent",
    organizationId: data.organizationId,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const generateDriverToken = (data: { id: string; name: string; organizationId: string }): string => {
  const payload: TokenPayload = {
    id: data.id,
    name: data.name,
    role: "driver",
    organizationId: data.organizationId,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const generateCoDriverToken = (data: { id: string; name: string; organizationId: string }): string => {
  const payload: TokenPayload = {
    id: data.id,
    name: data.name,
    role: "codriver",
    organizationId: data.organizationId,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new UnauthorizedError("Invalid token");
  }
};
