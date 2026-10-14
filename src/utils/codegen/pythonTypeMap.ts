import { PrimitiveMemberValue } from "@utils/codegen";

export const pythonTypeMap: {
  [key in PrimitiveMemberValue]: string;
} = {
  string: "str",
  number: "float",
  boolean: "bool",
  "string | null": "Optional[str]",
  "number | null": "Optional[float]",
  "boolean | null": "Optional[bool]",
  "string | undefined": "str | EllipsisType",
  "number | undefined": "float | EllipsisType",
  "boolean | undefined": "bool | EllipsisType",
  "string | null | undefined": "Optional[str] | EllipsisType",
  "number | null | undefined": "Optional[float] | EllipsisType",
  "boolean | null | undefined": "Optional[bool] | EllipsisType",
  null: "None",
  undefined: "EllipsisType", // Using EllipsisType as a placeholder, since Python doesn't have an undefined type
  "null | undefined": "NotRequired[Optional[None]]",
};

export const pythonMemberTypeMap: { [key in PrimitiveMemberValue]: string } = {
  string: "str",
  number: "float",
  boolean: "bool",
  "string | null": "Optional[str]",
  "number | null": "Optional[float]",
  "boolean | null": "Optional[bool]",
  "string | undefined": "NotRequired[str]",
  "number | undefined": "NotRequired[float]",
  "boolean | undefined": "NotRequired[bool]",
  "string | null | undefined": "NotRequired[Optional[str]]",
  "number | null | undefined": "NotRequired[Optional[float]]",
  "boolean | null | undefined": "NotRequired[Optional[bool]]",
  null: "None",
  undefined: "NotRequired[str]", // Using str as a placeholder, since Python doesn't have an undefined type
  "null | undefined": "NotRequired[Optional[None]]",
};
