import { Response, Request } from "express";
export declare const getAllVotes: (req: Request, res: Response) => Promise<void>;
export declare const getVote: (req: Request, res: Response) => Promise<void>;
export declare const createVote: (req: Request, res: Response) => Promise<void>;
export declare const updateVote: (req: Request, res: Response) => Promise<void>;
export declare const deleteVote: (req: Request, res: Response) => Promise<void>;
