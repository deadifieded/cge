/**
 * Every environment generated code can run in. `shared` in `schemas/` is
 * keyed by these names, so adding one here makes typecheck point at every
 * schema that needs an entry for it.
 */
export const environments = ["development", "staging", "production"] as const;
export type Environment = (typeof environments)[number];
