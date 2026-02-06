import GitLfsLazyResourceLoader from "@core/GitLfs/GitLfsLazyResourceLoader";
import LinkResourceManager from "@core/Link/LinkResourceManager";
import { ArticleParsedContext, ParsedContext } from "@ext/markdown/core/Parser/ParserContext/ParsedContext";
import { Question } from "@ext/markdown/elements/question/types";
import ResourceManager from "../../../../../logic/Resource/ResourceManager";
import ParserContext from "./ParserContext";

export default interface PrivateParserContext extends ParserContext, ParsedContext {}

export const createPrivateParserContext = (context: ParserContext): PrivateParserContext => {
	const rootPath = context.getCatalog()?.getRootCategoryRef().path.parentDirectoryPath;
	const basePath2 = rootPath?.subDirectory(context.getArticle().ref.path.parentDirectoryPath);

	const icons = new Set<string>();
	const snippet = new Set<string>();
	const questions = new Map<string, Question>();

	const linkManager = new LinkResourceManager(context.fp, basePath2, rootPath);
	const resourceManager = new ResourceManager(context.fp, basePath2, rootPath);

	const gitLfsLoader = new GitLfsLazyResourceLoader(
		context.getCatalog(),
		resourceManager,
		context.getRepositoryProvider(),
	);
	gitLfsLoader.mount();

	const parsedContext = ArticleParsedContext.create(icons, snippet, questions, linkManager, resourceManager);

	return {
		getItemByPath: context.getItemByPath.bind(context),
		getRootLogicPath: context.getRootLogicPath.bind(context),
		getArticle: context.getArticle.bind(context),
		getCatalog: context.getCatalog.bind(context),
		getStorageId: context.getStorageId.bind(context),
		getRootPath: context.getRootPath.bind(context),
		getBasePath: context.getBasePath.bind(context),
		getIsLogged: context.getIsLogged.bind(context),
		getLanguage: context.getLanguage.bind(context),
		getDiagramRendererServerUrl: context.getDiagramRendererServerUrl.bind(context),
		getProp: context.getProp.bind(context),
		getTablesManager: context.getTablesManager.bind(context),
		getUserByMail: context.getUserByMail.bind(context),
		createContext: context.createContext.bind(context),
		getWorkspaceManager: context.getWorkspaceManager.bind(context),
		getRepositoryProvider: context.getRepositoryProvider.bind(context),
		fp: context.fp,
		parser: context.parser,
		formatter: context.formatter,
		icons: parsedContext.icons,
		snippet: parsedContext.snippet,
		questions: parsedContext.questions,
		getLinkManager: parsedContext.getLinkManager.bind(parsedContext),
		getResourceManager: parsedContext.getResourceManager.bind(parsedContext),
	};
};
