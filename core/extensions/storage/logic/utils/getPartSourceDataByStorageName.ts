import { env } from "@app/resolveModule/env";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import parseStorageUrl from "../../../../logic/utils/parseStorageUrl";
import SourceType from "../SourceDataProvider/model/SourceType";

const getPartGitSourceDataByStorageName = (
	name: string,
): {
	sourceType: SourceType;
	data: Partial<GitSourceData>;
} => {
	const emptyObject = { sourceType: null, data: {} };
	if (!name) return emptyObject;
	const storageUrl = env("STORAGE_URL");
	const storageDomain = storageUrl ? parseStorageUrl(storageUrl).domain : null;
	const lcName = name.toLowerCase();
	if (lcName.includes("github")) {
		return { sourceType: SourceType.gitHub, data: {} };
	}
	if (lcName.includes("gitlab")) {
		return { sourceType: SourceType.gitLab, data: { domain: name } };
	}
	if (storageDomain && lcName.includes(storageDomain)) {
		return { sourceType: SourceType.enterprise, data: { domain: name } };
	}
	return emptyObject;
};

export default getPartGitSourceDataByStorageName;
