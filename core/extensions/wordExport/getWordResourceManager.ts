import type ResourceManager from "@core/Resource/ResourceManager";
import type ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import type { AddOptionsWord } from "@ext/wordExport/options/WordTypes";

const getWordResourceManager = async (
	addOptions: AddOptionsWord,
	parserContext: ParserContext,
	resourceManager: ResourceManager,
) => {
	return (
		(addOptions?.fragmentId && (await getFragmentResourceManager(addOptions.fragmentId, parserContext))) ||
		resourceManager
	);
};

const getFragmentResourceManager = async (
	fragmentId: string,
	parserContext: ParserContext,
): Promise<ResourceManager | undefined> => {
	const catalog = parserContext?.getCatalog?.();
	const fragmentProvider = catalog?.customProviders?.fragmentProvider;
	if (!fragmentProvider) return;

	const fragmentArticle = fragmentProvider.getArticle(fragmentId);
	if (!fragmentArticle) return;

	const readResourceManager = () => fragmentArticle.parsedContent.read((p) => p?.parsedContext?.getResourceManager());

	let resourceManager = await readResourceManager();
	if (resourceManager) return resourceManager;

	const fragmentContext = parserContext.createContext(fragmentArticle);
	await fragmentProvider.getRenderData(fragmentId, fragmentContext);

	resourceManager = await readResourceManager();
	return resourceManager;
};

export default getWordResourceManager;
