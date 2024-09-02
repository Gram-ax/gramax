import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import PathnameData from "@core/RouterPath/model/PathnameData";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import Storage from "@ext/storage/logic/Storage";
import type { Workspace } from "@ext/workspace/Workspace";

export enum PageDataType {
	article = "article",
	notFound = "notFound",
	home = "home",
}

const getPageDataByPathname = async (
	pathnameData: PathnameData,
	workspace: Workspace,
): Promise<{ type: PageDataType; itemLogicPath?: string[] }> => {
	if (RouterPathProvider.isLocal(pathnameData)) {
		if (await workspace.getCatalog(pathnameData.catalogName))
			return { type: PageDataType.article, itemLogicPath: pathnameData.itemLogicPath };
		else return { type: PageDataType.notFound };
	}
	if (!RouterPathProvider.validate(pathnameData)) return { type: PageDataType.notFound };

	let itemLogicPath: string[];
	let catalog: Catalog;

	if (await workspace.getCatalog(pathnameData.catalogName)) {
		catalog = await workspace.getCatalog(pathnameData.catalogName);
		itemLogicPath = pathnameData.itemLogicPath;
	} else if (await workspace.getCatalog(pathnameData.repName)) {
		catalog = await workspace.getCatalog(pathnameData.repName);
		itemLogicPath = pathnameData.repNameItemLogicPath;
	}

	if (!catalog) return { type: PageDataType.home };
	const { storage } = catalog.repo;

	if (!storage) return { type: PageDataType.notFound };

	const isGit = isGitSourceType(await storage.getType());
	if (await isDataReal(isGit, storage, pathnameData)) {
		return { type: PageDataType.article, itemLogicPath };
	} else return { type: PageDataType.notFound };
};

const isDataReal = async (isGit: boolean, storage: Storage, pathnameData: PathnameData) => {
	return (
		(await storage.getSourceName()) === pathnameData.sourceName &&
		(isGit ? (await (storage as GitStorage).getGroup()) === pathnameData.group : true) &&
		(await storage.getName()) == pathnameData.repName
	);
};

export default getPageDataByPathname;
