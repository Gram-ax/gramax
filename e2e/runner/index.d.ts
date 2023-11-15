import { CommandTree } from "@app/commands";
import Application from "@app/types/Application";

declare global {
	interface Window {
		app: Application;
		commands: CommandTree;
		updateContent: () => Promise<void>;
		documentReady: boolean;
		debug: any;
	}
}
