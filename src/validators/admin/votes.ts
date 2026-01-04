import { z } from "zod";

export const createFullVoteSchema = z.object({
  body: z.object({
    name: z.string(),
    maxSelections: z.number().min(1),
    items: z.array(z.string().min(1)).optional(),
    startDate: z.string(),
    endDate: z.string(),
  }),
});

export const updateVoteSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    maxSelections: z.number().min(1).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    items: z.array(z.any()).optional(),
  }),
});
