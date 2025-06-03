import { FC } from "react";

export type ExtractComponentGeneric<T> = T extends FC<infer P> ? P : never;
