import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
    // Path to your schema file
    schema: "prisma/schema.prisma",

    // Database URL configuration
    datasource: {
        url: env("DATABASE_URL"),
    },

    // Optional: Migration configurations
    /*
    migrations: {
      path: "prisma/migrations",
      seed: "tsx prisma/seed.ts",
    },
    */
});
