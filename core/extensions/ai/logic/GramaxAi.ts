import { GramaxAi, GramaxAiOptions } from "@ext/ai/models/types";
import { CheckAuthResponse, TextGenerationApiClient } from "@ics/gx-vector-search";
import { CheckResponse } from "@ics/gx-vector-search";
import assert from "assert";

class DefaultGramaxAi implements GramaxAi {
	private _client: TextGenerationApiClient;

	constructor(private _options: GramaxAiOptions) {
		if (this._options.apiUrl)
			this._client = new TextGenerationApiClient({
				baseUrl: this._options.apiUrl,
				apiKey: this._options.token,
				meta: this._options.meta,
			});
	}

	async generateText(command: string): Promise<string> {
		const res = await this._client.generate({ command: { text: command } }, {});

		assert(res.text, "No text returned");

		return res.text;
	}

	async prettifyText(command: string, text: string): Promise<string> {
		const res = await this._client.prettify({
			command: { text: command },
			text,
		});

		assert(res.text, "No text returned");

		return res.text;
	}

	async checkServer(): Promise<CheckResponse> {
		return await this._client.checkServer();
	}

	async checkAuth(): Promise<CheckAuthResponse> {
		return await this._client.checkAuth();
	}
}

export default DefaultGramaxAi;
