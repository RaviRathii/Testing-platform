import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("mongodb://mocktest:mocktest@localhost:27017/mocktest?authSource=admin"),
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .min(1)
    .default("http://localhost:3000/api"),
});

export const env = envSchema.parse(process.env);
