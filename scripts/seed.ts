import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

console.log("No seed data has been configured yet.");
