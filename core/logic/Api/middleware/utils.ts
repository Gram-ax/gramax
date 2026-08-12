import { getExecutingEnvironment } from "@app/resolveModule/env";
import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import type ApiRequest from "../ApiRequest";
import type ApiResponse from "../ApiResponse";
import type Query from "../Query";

export const getQueryParam = (value: string | string[] | undefined): string | undefined => {
	if (Array.isArray(value)) return value[0];
	return value;
};

export const buildContext = async (app: Application, req: ApiRequest, res: ApiResponse): Promise<Context> => {
	const query = req.query;
	const env = getExecutingEnvironment();

	if (env === "web" || env === "tauri") {
		const queryLanguage = getQueryParam(query?.l);
		const language = typeof queryLanguage === "string" ? queryLanguage : "en";
		return app.contextFactory.fromWeb({ language, query: query as Query });
	}

	return app.contextFactory.fromNode({ req, res, query: query as Query });
};
