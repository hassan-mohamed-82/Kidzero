import { optional, z } from "zod";

// Base image validation (base64 string)
const base64Image = z
  .string()
  .min(1, "Image is required")
  .refine((val) => val.startsWith("data:image/"), {
    message: "Invalid base64 image format",
  });

// Create Competition
export const createCompetitionSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    mainImagepath: base64Image,
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid startDate",
    }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid endDate",
    }),
    images: z.array(base64Image).optional(),
  }),
});

// Update Competition (partial allows optional fields)
export const updateCompetitionSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    mainImagepath: base64Image.optional(),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid startDate",
      })
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid endDate",
      })
      .optional(),
    images: z.array(z.any()).optional(),
  }),
});

// Remove user from competition
export const removeUserSchema = z.object({
  params: z.object({
    id: z.string(),
    userId: z.string(),
  }),
});
