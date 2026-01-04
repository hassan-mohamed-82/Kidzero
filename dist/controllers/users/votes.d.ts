import { Request, Response } from "express";
export declare const getAllVotes: (req: Request, res: Response) => Promise<void>;
export declare const getVote: (req: Request, res: Response) => Promise<void>;
export declare const submitVote: (req: Request, res: Response) => Promise<void>;
export declare const voteResult: (req: Request, res: Response) => Promise<void>;
