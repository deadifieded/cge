import { ORIGIN } from "../origin";
import axios, { AxiosInstance } from "axios";
export type OutputType = {
  totalDaysAway: number;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertIsOutputType(value: any): asserts value is OutputType {
  if (typeof value !== "object") {
    throw new Error(`value is not of type {
      totalDaysAway: number;
    }`);
  }
  if (typeof value.totalDaysAway !== "number")
    throw new Error(`value.totalDaysAway is not of type number`);
}
export type InputType = {
  dayEdits: {
    date: number;
    away: boolean;
  }[];
};
export type ParamType = null;
type EditCalendarDataErrorCode = never;
export class EditCalendarDataError extends Error {
  code: EditCalendarDataErrorCode;
  constructor(code: EditCalendarDataErrorCode, detail: string) {
    super(detail);
    this.code = code;
  }
}
export class EditCalendarData {
  origin = ORIGIN;
  name = "EditCalendarData";
  route = "/calendar/data";
  method = "POST";
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
