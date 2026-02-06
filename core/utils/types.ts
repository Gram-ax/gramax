export type MutableArray<T> = T extends readonly (infer U)[] ? U[] : T;
