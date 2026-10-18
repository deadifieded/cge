import { ORIGIN } from "../origin";
import axios, { AxiosInstance } from "axios";
export type OutputType = {
  datesAway: {
    date: number;
    away: boolean;
  }[];
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertIsOutputType(value: any): asserts value is OutputType {
  if (typeof value !== "object") {
    throw new Error(`value is not of type {
      datesAway: {
        date: number;
        away: boolean;
      }[];
    }`);
  }
  if (!Array.isArray(value.datesAway))
    throw new Error(`value.datesAway is not of type {
    date: number;
    away: boolean;
  }[]`);
  for (const item0 of value.datesAway) {
    if (typeof item0 !== "object") {
      throw new Error(`value.datesAway[] is not of type {
        date: number;
        away: boolean;
      }`);
    }
    if (typeof item0.date !== "number")
      throw new Error(`value.datesAway[].date is not of type number`);
    if (typeof item0.away !== "boolean")
      throw new Error(`value.datesAway[].away is not of type boolean`);
  }
}
export type InputType = null;
export type ParamType = {
  month: number;
  year: number;
};
type GetCalendarDataErrorCode = never;
export class GetCalendarDataError extends Error {
  code: GetCalendarDataErrorCode;
  constructor(code: GetCalendarDataErrorCode, detail: string) {
    super(detail);
    this.code = code;
  }
}
export class GetCalendarData {
  origin = ORIGIN;
  name = "GetCalendarData";
  route = "/calendar/data";
  method = "GET";
  client: AxiosInstance;
  constructor(client: AxiosInstance = axios) {
    this.client = client;
  }
  async handleRaw(input: InputType, params: ParamType): Promise<unknown> {
    const response = await this.client({
      method: this.method,
      url: this.route,
      baseURL: this.origin,
      headers: { "content-type": "application/json" },
      data: input,
      params: params,
    });
    return response.data;
  }
  async handle(input: InputType, params: ParamType): Promise<OutputType> {
    try {
      const output = await this.handleRaw(input, params);
      assertIsOutputType(output);
      return output;
    } catch (error) {
      throw error;
    }
  }
}
