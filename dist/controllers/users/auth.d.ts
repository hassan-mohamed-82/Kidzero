import { Request, Response } from "express";
export declare const signup: (req: Request, res: Response) => Promise<void>;
export declare const verifyEmail: (req: Request, res: Response) => Promise<void>;
export declare const login: (req: Request, res: Response) => Promise<void>;
export declare const getFcmToken: (req: Request, res: Response) => Promise<void>;
export declare const sendResetCode: (req: Request, res: Response) => Promise<void>;
export declare const verifyCode: (req: Request, res: Response) => Promise<void>;
export declare const resetPassword: (req: Request, res: Response) => Promise<void>;
export declare const resendVerificationCode: (req: Request, res: Response) => Promise<void>;
