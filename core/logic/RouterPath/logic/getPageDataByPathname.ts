import Library from "@core/Library/Library";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import PathnameData from "@core/RouterPath/model/PathnameData";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

export enum PageDataType {
	article = "article",
	notFound = "notFound",
	home = "home",
}

const getPageDataByPathname = async (pathnameData: PathnameData, lib: Library): Promise<PageDataType> => {
	if (RouterPathProvider.isLocal(pathnameData)) {
		if (await lib.getCatalog(pathnameData.catalogName)) return PageDataType.article;
		else return PageDataType.notFound;
	}
	if (!RouterPathProvider.validate(pathnameData)) return PageDataType.notFound;
	const catalog = await lib.getCatalog(pathnameData.catalogName);
	if (catalog) {
		const { storage } = catalog.repo;
		const isGit =
			(await storage.getType()) === SourceType.gitLab || (await storage.getType()) === SourceType.gitHub;
		if (
			(await storage.getSourceName()) === pathnameData.sourceName &&
			(isGit ? (await (storage as GitStorage).getGroup()) === pathnameData.group : true) &&
			(await storage.getName()) == pathnameData.repName
		) {
			return PageDataType.article;
		} else return PageDataType.notFound;
	}
	return PageDataType.home;
};

export default getPageDataByPathname;
