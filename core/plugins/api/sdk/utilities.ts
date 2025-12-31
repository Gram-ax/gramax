import { getDeps } from "./core";

export const PlatformEnvironments = {
	Browser: "browser",
	Desktop: "tauri",
	DocPortal: "next",
	Static: "static",
	StaticCli: "cli",
} as const;

export type PlatformEnvironmentKey = keyof typeof PlatformEnvironments;

export const isPlatform = (platform: PlatformEnvironmentKey): boolean => getDeps().isPlatform(platform);
