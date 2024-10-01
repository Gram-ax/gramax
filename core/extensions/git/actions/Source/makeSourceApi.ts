import sourcesAPI from "@ext/git/actions/Source/sourcesApi";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import { SourceAPI } from "./SourceAPI";

export const makeSourceApi = (source: SourceData, authServiceUrl?: string): SourceAPI => {
	const sourceApi = sourcesAPI[source.sourceType]?.(source, authServiceUrl);
	if (sourceApi) return sourceApi;
};
