import { ProjectApis } from "@resources/api";

export const apis: ProjectApis = [
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
      {
        name: "GetUsername",
        method: "GET",
        route: "/username",
        users: ["frontend"],
        params: {},
        output: {
          status: "string",
        },
      },
      {
        name: "ChangeUsername",
        method: "POST",
        route: "/username/change",
        users: ["frontend"],
        input: {
          newUsername: "string",
        },
        output: {
          status: "string",
        },
      },
      {
        name: "GetCalendarData",
        method: "GET",
        route: "/calendar/data",
        users: ["frontend"],
        params: {"month": "number", "year": "number"},
        output: {
          datesAway: [{ date: "number", away: "boolean"}],
        },
      },
      {
        name: "EditCalendarData",
        method: "POST",
        route: "/calendar/data",
        users: ["frontend"],
        input: {
          dayEdits: [{ date: "number", away: "boolean"}],
        },
        output: {
          totalDaysAway: "number"
        }
      }
    ],
  },
];
