import type Application from "@app/types/Application";

declare module "@gramax/sdk" {
	interface PluginCommandContext {
		app: Application;
	}
}
