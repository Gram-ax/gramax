import OnNetworkApiErrorService from "@ext/errorHandlers/client/OnNetworkApiErrorService";
import NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
import sourcesAPI from "@ext/git/actions/Source/sourcesApi";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import { useMemo } from "react";
import { SourceAPI } from "./SourceAPI";

export const makeSourceApi = (
	source: SourceData,
	authServiceUrl?: string,
	onError?: (error: NetworkApiError) => void,
): SourceAPI => {
	const sourceApi = sourcesAPI[source.sourceType]?.(source, authServiceUrl, onError);
	if (sourceApi) return sourceApi;
};

export const useMakeSourceApi = (source: SourceData, authServiceUrl?: string): SourceAPI => {
	const onNetworkApiError = OnNetworkApiErrorService.value;
	const sourceApi = useMemo(
		() => makeSourceApi(source, authServiceUrl, onNetworkApiError),
		[source, authServiceUrl, onNetworkApiError],
	);
	return sourceApi;
};
