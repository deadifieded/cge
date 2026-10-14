export type Language = "py" | "ts";
export type Languages = {
  [key in Language]?: boolean;
};
