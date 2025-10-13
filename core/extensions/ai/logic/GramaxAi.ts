import { AiProvider, GramaxAiOptions } from "@ext/ai/models/types";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import {
	AudioProcessingApiClient,
	CheckAuthResponse,
	GenerateResponse,
	PrettifyResponse,
	RequestOptions,
	TextGenerationApiClient,
	TranscribeRequest,
	TranscribeResponse,
} from "@ics/gx-vector-search";
import { CheckResponse } from "@ics/gx-vector-search";

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
		const res = await this.errorHandler<GenerateResponse>(
			async () => await this._textGenApiClient.generate({ command: { text: command } }, {}),
		);

		return res?.text;
	}

	async prettifyText(command: string, text: string): Promise<string> {
		const res = await this.errorHandler<PrettifyResponse>(
			async () =>
				await this._textGenApiClient.prettify({
					command: { text: command },
					text,
				}),
		);

		return res?.text;
	}

	async transcribe(request: TranscribeRequest, options?: RequestOptions): Promise<TranscribeResponse> {
		return await this.errorHandler<TranscribeResponse>(
			async () => await this._audioApiClient.transcribe(request, options),
		);
	}

	async checkServer(): Promise<CheckResponse> {
		return await this._textGenApiClient.checkServer();
	}

	async checkAuth(): Promise<CheckAuthResponse> {
		return await this._textGenApiClient.checkAuth();
	}

	private async errorHandler<T>(callback: () => Promise<T>) {
		try {
			return await callback();
		} catch (error) {
			throw new DefaultError(
				t("ai.responseError.body"),
				null,
				{ html: true },
				false,
				t("ai.responseError.title"),
			);
		}
	}
}

export default DefaultGramaxAi;
