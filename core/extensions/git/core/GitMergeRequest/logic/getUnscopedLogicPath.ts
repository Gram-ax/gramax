import PathnameData from "@core/RouterPath/model/PathnameData";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";

const getUnscopedLogicPath = (logicPath: string, unscopedCatalogName: string) => {
	const pathnameData = RouterPathProvider.parsePath(logicPath);
	const newPathnameData: PathnameData = {
		...pathnameData,
		itemLogicPath: undefined,
		catalogName: unscopedCatalogName,
	};
	return RouterPathProvider.getPathname(newPathnameData);
};

export default getUnscopedLogicPath;
