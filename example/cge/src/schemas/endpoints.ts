import { ProjectEndpoints } from "@resources/api/types";

export const endpoints: ProjectEndpoints = [
  {
    provider: "api",
    shared: {
      development: { origin: "http://localhost:5432" },
      staging: { origin: "https://staging.example.com" },
      production: { origin: "https://example.com" },
    },
    schemas: [
      {
        name: "HealthCheck",
        method: "GET",
        route: "/health",
        users: [],
        params: {},
        output: {
          status: "string",
        },
      },
    ],
  },
];
