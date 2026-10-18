import { ORIGIN } from "../origin";
import axios, { AxiosInstance } from "axios";
export type OutputType = {
  status: string;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertIsOutputType(value: any): asserts value is OutputType {
  if (typeof value !== "object") {
    throw new Error(`value is not of type {
      status: string;
    }`);
  }
  if (typeof value.status !== "string")
    throw new Error(`value.status is not of type string`);
}
export type InputType = null;
export type ParamType = {};
type GetUsernameErrorCode = never;
export class GetUsernameError extends Error {
  code: GetUsernameErrorCode;
  constructor(code: GetUsernameErrorCode, detail: string) {
    super(detail);
    this.code = code;
  }
}
export class GetUsername {
  origin = ORIGIN;
  name = "GetUsername";
  route = "/username";
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
