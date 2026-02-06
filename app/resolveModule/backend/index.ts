import type { BackendDynamicModules } from "..";

declare function resolveBackendModule<K extends keyof BackendDynamicModules>(name: K): BackendDynamicModules[K];

export declare function initBackendModules(): Promise<void>;

export default resolveBackendModule;
