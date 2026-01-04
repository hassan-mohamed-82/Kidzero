import { Request } from "express";
export declare function saveBase64Image(base64: string, userId: string, req: Request, folder: string): Promise<string>;
