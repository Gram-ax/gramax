import { Content } from "@core/FileStructue/Article/Article";
import editTreeToRenderTree from "@ext/markdown/core/Parser/EditTreeToRenderTree";
import ParseError from "@ext/markdown/core/Parser/Error/ParseError";
import PrivateParserContext, {
	createPrivateParserContext,
} from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";
import quizTokensTransformer from "@ext/markdown/elements/answer/edit/logic/quizTokensTransformer";
import inlineNodeTransformers from "@ext/markdown/elements/comment/edit/logic/inlineNodeTransformers";
import commentTokenTransformer from "@ext/markdown/elements/comment/logic/commentTokenTransformer";
import cutTokenTransformer from "@ext/markdown/elements/cut/logic/cutTokenTransformer";
import inlineCutNodeTransformer from "@ext/markdown/elements/cut/logic/inlineCutNodeTransformer";
import diagramsNodeTransformer from "@ext/markdown/elements/diagrams/logic/transformer/diagramsNodeTransformer";
import fileMarkTransformer from "@ext/markdown/elements/file/logic/fileMarkTransformer";
import htmlTokenTransformer from "@ext/markdown/elements/html/logic/htmlTokenTransformer";
import htmlTagNodeTransformer from "@ext/markdown/elements/htmlTag/logic/htmlTagNodeTransformer";
import htmlTagTokenTransformer from "@ext/markdown/elements/htmlTag/logic/htmlTagTokenTransformer";
import iconTokenTransformer from "@ext/markdown/elements/icon/logic/iconTokenTransformer";
import imageTokenTransformer from "@ext/markdown/elements/image/logic/imageTokenTransformer";
import inlineImageTokenTransformer from "@ext/markdown/elements/inlineImage/edit/logic/inlineImageTokenTransformer";
import inlinePropertyTokenTransformer from "@ext/markdown/elements/inlineProperty/edit/logic/inlinePropertyTokenTransformer";
import taskListNodeTransformer from "@ext/markdown/elements/list/edit/models/taskList/logic/taskListNodeTransformer";
import blockMdNodeTransformer from "@ext/markdown/elements/md/logic/blockMdNodeTransformer";
import noteNodeTransformer from "@ext/markdown/elements/note/logic/noteNodeTransformer";
import paragraphNodeTransformer from "@ext/markdown/elements/paragraph/logic/paragraphNodeTransformer";
import tableTokenTransformer from "@ext/markdown/elements/table/logic/tableTokenTransformer";
import getTabsNodeTransformer from "@ext/markdown/elements/tabs/edit/logic/getTabsNodeTransformer";
import unsupportedNodeTransformer from "@ext/markdown/elements/unsupported/logic/unsupportedNodeTransformer";
import getTocItems, { getLevelTocItemsByRenderableTree } from "@ext/navigation/article/logic/createTocItems";
import { JSONContent } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { ProsemirrorMarkdownParser, ProsemirrorTransformer } from "../edit/logic/Prosemirror";
import { getSchema } from "../edit/logic/Prosemirror/schema";
import { getTokens } from "../edit/logic/Prosemirror/tokens";
import getComponentsHTML from "../render/components/getComponents/getComponentsHTML";
import getNodeElementRenderModels from "../render/logic/getRenderElements/getNodeElementRenderModels";
import getTagElementRenderModels from "../render/logic/getRenderElements/getTagElementRenderModels";
import Markdoc, {
	Config,
	RenderableTreeNode,
	RenderableTreeNodes,
	Schema,
	Tag,
	Token,
	Tokenizer,
} from "../render/logic/Markdoc";
import MdParser from "./MdParser/MdParser";
import ParserContext from "./ParserContext/ParserContext";
import preTransformTokens from "./Transformer/preTransformTokens";

const katexPlugin = import("@traptitech/markdown-it-katex");

class GetHtmlValue {
	private _html: string;

	constructor(private _parseToHtml: () => Promise<string>) {}

	async get() {
		if (!this._html) this._html = await this._parseToHtml();
		return this._html;
	}
}

export type EditRenderableTreeNode = RenderableTreeNode | Node;

export default class MarkdownParser {
	public async parse(content: string, context?: ParserContext, requestUrl?: string): Promise<Content> {
		try {
			const privateContext: PrivateParserContext = context ? createPrivateParserContext(context) : undefined;

			const schemes = this._getSchemes(privateContext);
			const tokens = this._getTokens(content, schemes);
			const editTree = await this._editParser(tokens, schemes, privateContext);
			const renderTree = editTreeToRenderTree(editTree, getSchema());
			const tocItems = getTocItems(getLevelTocItemsByRenderableTree((renderTree as Tag)?.children ?? []));
			return {
				editTree,
				renderTree,
				getHtmlValue: new GetHtmlValue(async () => await this.parseToHtml(content, privateContext, requestUrl)),
				tocItems,
				parsedContext: privateContext,
			};
		} catch (e) {
			throw new ParseError(e);
		}
	}

	public async editParse(content: string, context?: PrivateParserContext): Promise<JSONContent> {
		const schemes = this._getSchemes(context);
		const tokens = this._getTokens(content, schemes);
		return this._editParser(tokens, schemes, context);
	}

	public async parseToHtml(content: string, context?: ParserContext, requestUrl?: string): Promise<string> {
		const parsedContent = await this.parse(content, context);
		return this.getHtml(parsedContent.renderTree, context, requestUrl);
	}

	public getHtml(renderTree: RenderableTreeNodes, context?: ParserContext, requestUrl?: string): string {
		return Markdoc.renderers.html(renderTree, {
			components: getComponentsHTML(requestUrl, context),
		});
	}

	public async parseRenderableTreeNode(
		content: string,
		context?: PrivateParserContext,
		parserOptions?: ParserOptions,
	): Promise<RenderableTreeNodes> {
		const schemes = this._getSchemes(context);
		const tokens = this._getTokens(content, schemes);
		const renderTreeNode = await this._getRenderableTreeNode(tokens, schemes, context);
		return parserOptions ? this._oneElementTransformer(renderTreeNode, parserOptions) : renderTreeNode;
	}

	public renderMarkdownIt(content: string) {
		return this.getRenderMarkdownIt(content);
	}

	public getTokens(content: string, context: PrivateParserContext): Token[] {
		const schemes = this._getSchemes(context);
		return this._getTokens(content, schemes);
	}

	public async getRenderMarkdownIt(content: string): Promise<string> {
		const tokenizer = this._getTokenizer();
		tokenizer.use((await katexPlugin).default, {
			blockClass: "math-block",
			errorColor: " #cc0000",
		});
		return tokenizer.renderToHtml(content);
	}

	private _oneElementTransformer(node: RenderableTreeNodes, parserOptions: ParserOptions): RenderableTreeNodes {
		const filter = (node: RenderableTreeNodes, name: string) => {
			if (Array.isArray(node)) return node.map((n) => filter(n, name));
			if (typeof node === "string") return node;
			if (node.name === name) return node.children;
			return node;
		};
		if (!parserOptions.isOneElement) return node;
		else node = filter(node, "article");
		if (parserOptions.isBlock) return node;
		else node = filter(node, "p");
		return node;
	}

	private _getSchemes(context?: PrivateParserContext): Schemes {
		const tags = getTagElementRenderModels(context);
		const nodes = getNodeElementRenderModels(context);
		return { tags, nodes };
	}

	private _getTokens(content: string, schemes?: Schemes) {
		const mdParser = new MdParser({ tags: schemes.tags });
		const parseDoc = mdParser.preParse(content);
		const tokens = this._getTokenizer(schemes.tags).tokenize(parseDoc);
		return preTransformTokens(tokens);
	}

	private _getTokenizer(tags?: Schemes["tags"]) {
		const tokenizer = new Tokenizer({ linkify: false }, tags);
		return tokenizer;
	}
	private async _getRenderableTreeNode(
		tokens: Token[],
		schemes: Schemes,
		context?: PrivateParserContext,
	): Promise<RenderableTreeNode> {
		const variables = context?.getProp("variables") ?? {};
		const config: Config = { nodes: schemes.nodes, tags: schemes.tags, variables };
		const ast = Markdoc.parse(tokens);
		return Markdoc.transform(ast, config);
	}

	private async _editParser(tokens: Token[], schemes: Schemes, context?: PrivateParserContext): Promise<JSONContent> {
		const prosemirrorParser = new ProsemirrorMarkdownParser(getSchema(), this._getTokenizer(), getTokens(context));

		const transformer = new ProsemirrorTransformer(
			{ ...schemes.tags, ...schemes.nodes },
			[
				fileMarkTransformer,
				htmlTagNodeTransformer,
				paragraphNodeTransformer,
				blockMdNodeTransformer,
				taskListNodeTransformer,
				inlineCutNodeTransformer,
				diagramsNodeTransformer,
				noteNodeTransformer,
				unsupportedNodeTransformer,
				getTabsNodeTransformer(context),
				inlineNodeTransformers,
			],
			[
				inlineImageTokenTransformer,
				inlinePropertyTokenTransformer,
				htmlTokenTransformer,
				tableTokenTransformer,
				cutTokenTransformer,
				imageTokenTransformer,
				commentTokenTransformer,
				iconTokenTransformer,
				htmlTagTokenTransformer,
				quizTokensTransformer,
			],
			context,
		);

		const transformTokens = transformer.transformToken(tokens);

		const editTree = (await prosemirrorParser.parse(transformTokens)).toJSON();

		const transformEditTree = await transformer.transformTree(editTree, null, null, 0);

		const finalEditTree = await transformer.transformMdComponents(
			transformEditTree,
			this.parseRenderableTreeNode.bind(this),
		);

		return finalEditTree;
	}
}

export function visit(tree: RenderableTreeNode, name: string, callback: (node: RenderableTreeNode) => void) {
	if (typeof tree !== "string") {
		if (tree.name === name) callback(tree);
		tree.children.forEach((children) => visit(children, name, callback));
	}
}

export interface ParserOptions {
	isOneElement?: boolean;
	isBlock?: boolean;
}

export interface Schemes {
	tags: Record<string, Schema>;
	nodes: Record<string, Schema>;
}
