import { Request } from "express";

export interface AppUser {
  id: string;
  name: string;
  role: string;
}

// Extend Express Request with your custom user type
export interface AuthenticatedRequest extends Request {
  user?: AppUser; // Make user required
}

declare global {
  namespace Express {
    interface Request {
      user?: AppUser;
    } // extend default `User`
  }
}
