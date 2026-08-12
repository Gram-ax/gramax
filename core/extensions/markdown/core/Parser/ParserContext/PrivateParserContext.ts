import GitLfsLazyResourceLoader from "@core/GitLfs/logic/GitLfsLazyResourceLoader";
import LinkResourceManager from "@core/Link/LinkResourceManager";
import { ArticleParsedContext, type ParsedContext } from "@ext/markdown/core/Parser/ParserContext/ParsedContext";
import { getFragmentLegacyPath } from "@ext/markdown/elements/fragment/logic/getFragmentLegacyPath";
import type { Question } from "@ext/markdown/elements/question/types";
import ResourceManager from "../../../../../logic/Resource/ResourceManager";
import type ParserContext from "./ParserContext";

export default interface PrivateParserContext extends ParserContext, ParsedContext {}

export const createPrivateParserContext = (context: ParserContext): PrivateParserContext => {
	const rootPath = context.getCatalog()?.basePath;
	const basePath2 = rootPath?.subDirectory(context.getArticle().ref.path.parentDirectoryPath);

	const icons = new Set<string>();
	const fragment = new Set<string>();
	const questions = new Map<string, Question>();

	const linkManager = new LinkResourceManager(context.fp, basePath2, rootPath);
	const resourceManager = new ResourceManager(
		context.fp,
		basePath2,
		rootPath,
		getFragmentLegacyPath(basePath2, rootPath),
	);

	const gitLfsLoader = new GitLfsLazyResourceLoader(
		context.getCatalog(),
		resourceManager,
		context.getRepositoryProvider(),
		context.fp,
	);
	gitLfsLoader.mount();

	const parsedContext = ArticleParsedContext.create(icons, fragment, questions, linkManager, resourceManager);

	return {
		getItemByPath: context.getItemByPath.bind(context),
		getRootLogicPath: context.getRootLogicPath.bind(context),
		getArticle: context.getArticle.bind(context),
		getCatalog: context.getCatalog.bind(context),
		getStorageId: context.getStorageId.bind(context),
		getRootPath: context.getRootPath.bind(context),
		getBasePath: context.getBasePath.bind(context),
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
		fragment: parsedContext.fragment,
		questions: parsedContext.questions,
		getLinkManager: parsedContext.getLinkManager.bind(parsedContext),
		getResourceManager: parsedContext.getResourceManager.bind(parsedContext),
	};
};
