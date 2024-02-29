import parseStorageUrl from "../../../../logic/utils/parseStorageUrl";
import ShareData from "../../../catalog/actions/share/model/ShareData";
import GitShareData from "../../../git/core/model/GitShareData";
import GitSourceData from "../../../git/core/model/GitSourceData.schema";
import SourceData from "../SourceDataProvider/model/SourceData";
import SourceType from "../SourceDataProvider/model/SourceType";

const getStorageNameByData = (data: SourceData | ShareData): string => {
	let storageName: string = null;
	if (data.sourceType === SourceType.gitLab) {
		storageName = `${(data as GitSourceData | GitShareData).domain}`;
	} else if (data.sourceType === SourceType.gitHub) {
		storageName = `${(data as GitSourceData | GitShareData).domain}`;
	} else if (data.sourceType === SourceType.enterprise) {
		storageName = parseStorageUrl(`${(data as GitSourceData | GitShareData).domain}`).domain;
	}
	return storageName;
};

export default getStorageNameByData;
