import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";
import {
	CheckAuthResponse,
	CheckResponse,
	TranscribeResponse,
	RequestOptions,
	TranscribeRequest,
} from "@ics/gx-vector-search";

export type AiPrettifyOptions = {
	command: string;
};

export type AiGenerateOptions = {
	command: string;
};

export interface TiptapGramaxAiOptions {
	apiUrlCreator: ApiUrlCreator;
	resourceService: ResourceServiceType;
}

export type AiTranscribeOptions = {
	buffer: ArrayBuffer;
};

type Token = string;

type ApiUrl = string;

export interface AiServerConfig {
	apiUrl: ApiUrl;
	token: Token;
}

export interface AiData extends AiServerConfig {
	instanceName: string;
}

export type AppConfigAiData = Omit<AiData, "token">;

export type GramaxAiOptions = AiServerConfig & {
	meta?: {
		instanceName: string;
	};
};

export interface AiProvider {
	// Server
	checkServer(): Promise<CheckResponse>;
	checkAuth(): Promise<CheckAuthResponse>;

	// Text
	prettifyText(command: string, text: string): Promise<string>;
	generateText(command: string): Promise<string>;

	// Audio
	transcribe(request: TranscribeRequest, options?: RequestOptions): Promise<TranscribeResponse>;
}

export type SourceAiData = {
	apiUrl: string;
	isInvalid?: boolean;
};

export type AudioHistoryItem = {
	name: string;
	blob: Blob;
};
