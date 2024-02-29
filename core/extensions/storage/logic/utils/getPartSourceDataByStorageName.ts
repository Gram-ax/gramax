import { env } from "@app/resolveModule";
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
	const enterpriseUrl = `${env("ENTERPRISE_SERVER_URL")}/-storage`;
	const enterpriseDomain = enterpriseUrl ? parseStorageUrl(enterpriseUrl).domain : null;
	const lcName = name.toLowerCase();
	if (lcName.includes("github")) {
		return { sourceType: SourceType.gitHub, data: {} };
	}
	if (lcName.includes("gitlab")) {
		return { sourceType: SourceType.gitLab, data: { domain: name } };
	}
	if (enterpriseDomain && lcName.includes(enterpriseDomain)) {
		return { sourceType: SourceType.enterprise, data: { domain: name } };
	}
	return emptyObject;
};

export default getPartGitSourceDataByStorageName;
