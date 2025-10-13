import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";

export const makeGitShareData = (pathname: string) => {
	const pathnameData = RouterPathProvider.parsePath(new Path(pathname));

	return {
		sourceType: getPartGitSourceDataByStorageName(pathnameData.sourceName).sourceType,
		domain: pathnameData.sourceName,
		group: pathnameData.group,
		branch: pathnameData.refname,
		name: pathnameData.repo,
		isPublic: false,
		filePath: [],
	};
};
