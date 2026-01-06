import { z } from "zod";

export const submitVoteSchema = z.object({
  body: z.object({
    items: z.array(z.string()).min(1, "At least one item must be selected"),
  }),
});
