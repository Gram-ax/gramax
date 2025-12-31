import ResourceManager from "@core/Resource/ResourceManager";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { AddOptionsWord } from "@ext/wordExport/options/WordTypes";

const getWordResourceManager = async (addOptions: AddOptionsWord, parserContext: ParserContext) => {
	return (
		(addOptions?.snippetId && (await getSnippetResourceManager(addOptions.snippetId, parserContext))) ||
		parserContext.getResourceManager()
	);
};

const getSnippetResourceManager = async (
	snippetId: string,
	parserContext: ParserContext,
): Promise<ResourceManager | undefined> => {
	const catalog = parserContext?.getCatalog?.();
	const snippetProvider = catalog?.customProviders?.snippetProvider;
	if (!snippetProvider) return;

	const snippetArticle = snippetProvider.getArticle(snippetId);
	if (!snippetArticle) return;

	const readResourceManager = () => snippetArticle.parsedContent.read((p) => p?.resourceManager);

	let resourceManager = await readResourceManager();
	if (resourceManager) return resourceManager;

	const snippetContext = parserContext.createContext(snippetArticle);
	await snippetProvider.getRenderData(snippetId, snippetContext);

	resourceManager = await readResourceManager();
	return resourceManager;
};

export default getWordResourceManager;
