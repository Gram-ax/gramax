import { Locator } from "playwright";

const REPLACE_META_KEY = process.platform == "darwin" ? "Control" : "Meta";
const REPLACE_META_KEY_TO = process.platform == "darwin" ? "Meta" : "Control";

export interface Keyboard {
	press(keystroke: string): Promise<this>;
	type(text: string, force?: boolean): Promise<this>;
}

export class KeyboardContext implements Keyboard {
	constructor(private _locator: Locator) {}

	async press(keystroke: string) {
		await this._keystroke(keystroke);
		return this;
	}

	async type(text: string) {
		await this._locator.pressSequentially(text, { delay: 1 });
		return this;
	}

	private async _keystroke(keystroke: string) {
		for (const k of keystroke.replaceAll(REPLACE_META_KEY, REPLACE_META_KEY_TO).split(" ")) {
			await this._locator.press(k.trim(), { delay: 5 });
		}
	}
}
