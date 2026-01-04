import { RequestHandler } from "express";
import { AnyZodObject, ZodEffects } from "zod";
export declare const validate: (schema: AnyZodObject | ZodEffects<AnyZodObject>) => RequestHandler;
