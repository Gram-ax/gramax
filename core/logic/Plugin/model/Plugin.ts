import { PApplication } from "@core/Plugin/model/PApplication";

export interface PCommandConfig<P = any, O = any> {
	name: string;
	do: (this: { app: PApplication }, args: P) => O | Promise<O>;
}

export abstract class Plugin {
	private _commandConfigs: PCommandConfig[];

	constructor() {
		this._commandConfigs = [];
	}

	abstract name: string;

	abstract onLoad(): Promise<void> | void;

	abstract onUnload(): Promise<void> | void;

	get commandConfigs(): PCommandConfig[] {
		return this._commandConfigs;
	}

	addCommand<P = any, O = any>(command: PCommandConfig<P, O>) {
		this._commandConfigs.push(command);
	}
}
