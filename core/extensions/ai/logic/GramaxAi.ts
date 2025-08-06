import { AiProvider, GramaxAiOptions } from "@ext/ai/models/types";
import {
	AudioProcessingApiClient,
	CheckAuthResponse,
	RequestOptions,
	TextGenerationApiClient,
	TranscribeRequest,
	TranscribeResponse,
} from "@ics/gx-vector-search";
import { CheckResponse } from "@ics/gx-vector-search";
import assert from "assert";

class DefaultGramaxAi implements AiProvider {
	private _textGenApiClient: TextGenerationApiClient;
	private _audioApiClient: AudioProcessingApiClient;

	constructor(private _options: GramaxAiOptions) {
		if (!this._options.apiUrl) return;
		this._textGenApiClient = new TextGenerationApiClient({
			baseUrl: this._options.apiUrl,
			apiKey: this._options.token,
			meta: this._options.meta,
		});

		this._audioApiClient = new AudioProcessingApiClient({
			baseUrl: this._options.apiUrl,
			apiKey: this._options.token,
			meta: this._options.meta,
		});
	}

	async generateText(command: string): Promise<string> {
		const res = await this._textGenApiClient.generate({ command: { text: command } }, {});

		assert(res.text, "No text returned");

		return res.text;
	}

	async prettifyText(command: string, text: string): Promise<string> {
		const res = await this._textGenApiClient.prettify({
			command: { text: command },
			text,
		});

		assert(res.text, "No text returned");

		return res.text;
	}

	async transcribe(request: TranscribeRequest, options?: RequestOptions): Promise<TranscribeResponse> {
		return await this._audioApiClient.transcribe(request, options);
	}

	async checkServer(): Promise<CheckResponse> {
		return await this._textGenApiClient.checkServer();
	}

	async checkAuth(): Promise<CheckAuthResponse> {
		return await this._textGenApiClient.checkAuth();
	}
}

export default DefaultGramaxAi;
