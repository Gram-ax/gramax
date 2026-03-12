import type { DynamicModules } from "..";

declare function resolveFrontendModule<K extends keyof DynamicModules>(name: K): DynamicModules[K];

export default resolveFrontendModule;
