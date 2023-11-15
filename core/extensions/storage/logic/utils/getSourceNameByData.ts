import parseStorageUrl from "../../../../logic/utils/parseStorageUrl";
import ShareLinkData from "../../../catalog/actions/share/model/ShareLinkData";
import GitShareLinkData from "../../../git/core/model/GitShareLinkData";
import GitSourceData from "../../../git/core/model/GitSourceData.schema";
import SourceData from "../SourceDataProvider/model/SourceData";
import SourceType from "../SourceDataProvider/model/SourceType";

const getSourceNameByData = (data: SourceData | ShareLinkData): string => {
	let storageName: string = null;
	if (data.sourceType === SourceType.gitLab) {
		storageName = `${(data as GitSourceData | GitShareLinkData).domain}`;
	}
	if (data.sourceType === SourceType.gitHub) {
		storageName = `${(data as GitSourceData | GitShareLinkData).domain}`;
	}
	if (data.sourceType === SourceType.enterprise) {
		storageName = parseStorageUrl(`${(data as GitSourceData | GitShareLinkData).domain}`).domain;
	}
	return storageName;
};

export default getSourceNameByData;
