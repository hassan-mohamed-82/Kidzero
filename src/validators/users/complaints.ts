import { z } from "zod";

export const createComplaintSchema = z.object({
  body: z.object({
    categoryId: z.string(),
    content: z.string(),
  }),
});
