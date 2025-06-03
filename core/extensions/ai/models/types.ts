import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { CheckAuthResponse, CheckResponse } from "@ics/gx-vector-search";

export type AiPrettifyOptions = {
	command: string;
};

export type AiGenerateOptions = {
	command: string;
};

export interface TiptapGramaxAiOptions {
	apiUrlCreator: ApiUrlCreator;
}

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

export interface GramaxAi {
	prettifyText(command: string, text: string): Promise<string>;
	generateText(command: string): Promise<string>;
	checkServer(): Promise<CheckResponse>;
	checkAuth(): Promise<CheckAuthResponse>;
}

export type SourceAiData = {
	apiUrl: string;
	isInvalid?: boolean;
};
