import type { CommandTree } from "@app/commands";
import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import type { Article, Content } from "@core/FileStructue/Article/Article";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import type { Category } from "@core/FileStructue/Category/Category";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { getEditorStore } from "@core-ui/stores/EditorStore";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import type { JSONContent } from "@tiptap/core";
import type { AgentArticleParser } from "../parser";

async function embedDiagramSourcesInEditTree(
	node: JSONContent,
	ctx: Context,
	commands: CommandTree,
	catalog: ContextualCatalog,
	item: Article | Category,
): Promise<void> {
	if (node.type === "diagrams" && node.attrs?.src) {
		const getCmd = commands.article.resource.get;
		const res = (await getCmd.do(
			getCmd.params(
				ctx,
				{
					src: node.attrs.src,
					articlePath: item.ref.path.value,
					catalogName: catalog.name,
					mimeType: MimeTypes.text,
				},
				undefined,
			),
		)) as { hashItem: { getContent: () => Promise<string> } };
		node.attrs = { ...node.attrs, content: await res.hashItem.getContent() };
	}
	for (const child of node.content ?? []) {
		await embedDiagramSourcesInEditTree(child, ctx, commands, catalog, item);
	}
}

async function prepareEditTreeForEditor(
	editTree: JSONContent,
	title: string | undefined,
	ctx: Context,
	commands: CommandTree,
	catalog: ContextualCatalog,
	item: Article | Category,
): Promise<JSONContent> {
	const tree = getArticleWithTitle(title ?? "", editTree);
	await embedDiagramSourcesInEditTree(tree, ctx, commands, catalog, item);
	return tree;
}

export async function updateCatalogItem(
	app: Application,
	ctx: Context,
	catalog: ContextualCatalog,
	item: Article | Category,
	parser: AgentArticleParser,
	content: string,
	headingId?: string,
): Promise<Content> {
	const agentMarkdown = headingId ? await parser.applyHeadingSectionEdit(headingId, content) : content;
	const storageBody = await parser.applyChanges(agentMarkdown);
	const parserContext = await app.parserContextFactory.fromArticle(
		item,
		catalog,
		convertContentToUiLanguage(ctx.contentLanguage || catalog.props.language),
	);
	const parsedContent = await app.parser.parse(storageBody, parserContext);
	await item.updateContent(storageBody);
	return parsedContent;
}

export async function updateCatalogItemInUi(
	item: Article | Category,
	parsedContent: Content,
	ctx: Context,
	commands: CommandTree,
	catalog: ContextualCatalog,
): Promise<void> {
	await item.parsedContent.write(() => parsedContent);
	await item.events.emit("item-update-content", { item });

	const editor = getEditorStore().editor;
	if (!editor) {
		return;
	}

	const title = typeof item.props.title === "string" ? item.props.title : undefined;
	const editTree = await prepareEditTreeForEditor(parsedContent.editTree, title, ctx, commands, catalog, item);
	editor.chain().setMeta("ignoreDeleteNode", true).setMeta("ignoreDeleteMark", true).setContent(editTree).run();
}
