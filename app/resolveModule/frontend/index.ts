import type { DynamicModules } from "..";

declare function resolveFrontendModule<K extends keyof DynamicModules>(name: K): DynamicModules[K];

export declare function initFrontendModules(): Promise<void>;

export default resolveFrontendModule;
