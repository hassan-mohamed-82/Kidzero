// src/utils/auth.ts

import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../Errors";
import { TokenPayload } from "../types/custom";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET as string;

// للـ SuperAdmin (أنت - البائع)
export const generateSuperAdminToken = (data: {
  id: string;
  name: string;
  email: string;
}): string => {
  const payload: TokenPayload = {
    id: data.id,
    email: data.email,
    name: data.name,
    role: "superadmin",
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const generateSubAdminToken = (data: {
  id: string;
  name: string;
  email: string;
}): string => {
  const payload: TokenPayload = {
    id: data.id,
    email: data.email,
    name: data.name,
    role: "subadmin",
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

// للـ Organizer (صاحب المؤسسة)
export const generateOrganizerToken = (data: {
  id: string;
  name: string;
  email: string;
  organizationId: string;
}): string => {
  const payload: TokenPayload = {
    id: data.id,
    email: data.email,
    name: data.name,
    role: "organizer",
    organizationId: data.organizationId,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

// للـ Admin (موظف بصلاحيات)
export const generateAdminToken = (data: {
  id: string;
  name: string;
  email: string;
  organizationId: string;
}): string => {
  const payload: TokenPayload = {
    id: data.id,
    name: data.name,
    email: data.email,
    role: "admin",
    organizationId: data.organizationId,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

// للـ Driver (Mobile App)
export const generateDriverToken = (data: {
  id: string;
  name: string;
  email?: string;
  organizationId: string;
}): string => {
  const payload: TokenPayload = {
    id: data.id,
    name: data.name,
    email: data.email,
    role: "driver",
    organizationId: data.organizationId,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

// للـ CoDriver (Mobile App)
export const generateCoDriverToken = (data: {
  id: string;
  name: string;
  email?: string;
  organizationId: string;
}): string => {
  const payload: TokenPayload = {
    id: data.id,
    name: data.name,
    email: data.email,
    role: "codriver",
    organizationId: data.organizationId,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};


// للـ Parent (Mobile App)
export const generateParentToken = (data: {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  organizationId?: string;
}): string => {
  const payload: TokenPayload = {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: "parent",
    organizationId: data.organizationId,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

// Verify Token
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new UnauthorizedError("Invalid token");
  }
};
