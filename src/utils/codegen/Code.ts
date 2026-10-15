import { Language } from "../Language";

export type Code = { [key in Language]: string };

export function uniformCode(code: string): Code {
  return {
    py: code,
    ts: code,
  };
}
