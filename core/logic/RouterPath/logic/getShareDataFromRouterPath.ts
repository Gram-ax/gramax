import PathnameData from "@core/RouterPath/model/PathnameData";
import ShareData from "@ext/catalog/actions/share/model/ShareData";
import GitShareData from "@ext/git/core/model/GitShareData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const getShareDataFromPathnameData = (pathnameData: PathnameData, sourceType: SourceType): ShareData => {
	let shareData: ShareData = {
		filePath: pathnameData.filePath.join("/"),
		name: pathnameData.repName,
		sourceType,
	};
	if (sourceType === SourceType.gitHub || sourceType === SourceType.gitLab || sourceType === SourceType.git) {
		const { sourceName: domain, group, branch } = pathnameData;
		(shareData as GitShareData) = { ...shareData, domain, group, branch, sourceType };
	}
	return shareData;
};

export default getShareDataFromPathnameData;
