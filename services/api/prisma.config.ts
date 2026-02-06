import "dotenv/config";
import { defineConfig } from "prisma/config";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is missing. Check services/api/.env");
}

export default defineConfig({
  datasource: { url },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
