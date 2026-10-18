import { ENVIRONMENT, type Environment } from "../../../constants";

export const ORIGINS: Record<Environment, string> = {
  development: "http://localhost:5432",
  staging: "https://staging.example.com",
  production: "https://example.com",
};
export const ORIGIN = ORIGINS[ENVIRONMENT];
