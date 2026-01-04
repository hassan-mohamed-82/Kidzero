import { z } from "zod";

export const participateCompetitionSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
    gender: z.enum(["male", "female"]),
  }),
});
