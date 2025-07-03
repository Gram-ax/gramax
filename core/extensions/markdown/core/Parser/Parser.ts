import listItemNodeTransformer from "@ext/markdown/elements/list/edit/models/taskItem/logic/listItemNodeTransformer";
import taskListNodeTransformer from "@ext/markdown/elements/list/edit/models/taskList/logic/taskListNodeTransformer";
import noteNodeTransformer from "@ext/markdown/elements/note/logic/noteNodeTransformer";
import unsupportedNodeTransformer from "@ext/markdown/elements/unsupported/logic/unsupportedNodeTransformer";
import ParserContext from "./ParserContext/ParserContext";

import Markdoc, {
	Config,
	RenderableTreeNode,
	RenderableTreeNodes,
	Schema,
	Tag,
	Token,
	Tokenizer,
} from "../render/logic/Markdoc";

import getNodeElementRenderModels from "../render/logic/getRenderElements/getNodeElementRenderModels";
import getTagElementRenderModels from "../render/logic/getRenderElements/getTagElementRenderModels";

import { Content } from "@core/FileStructue/Article/Article";
import { getComponentsHTML } from "../render/components/getComponents/getComponents";
import MdParser from "./MdParser/MdParser";

import { Node } from "prosemirror-model";
import { ProsemirrorMarkdownParser, ProsemirrorTransformer } from "../edit/logic/Prosemirror";
import { getSchema } from "../edit/logic/Prosemirror/schema";
import { getTokens } from "../edit/logic/Prosemirror/tokens";

import commentNodeTransformer from "@ext/markdown/elements/comment/legacy/transformer/commentNodeTransformer";
import commentTokenTransformer from "@ext/markdown/elements/comment/logic/commentTokenTransformer";
import cutTokenTransformer from "@ext/markdown/elements/cut/logic/cutTokenTransformer";
import inlineCutNodeTransformer from "@ext/markdown/elements/cut/logic/inlineCutNodeTransformer";
import diagramsNodeTransformer from "@ext/markdown/elements/diagrams/logic/transformer/diagramsNodeTransformer";
import fileMarkTransformer from "@ext/markdown/elements/file/logic/fileMarkTransformer";
import iconTokenTransformer from "@ext/markdown/elements/icon/logic/iconTokenTransformer";
import imageTokenTransformer from "@ext/markdown/elements/image/logic/imageTokenTransformer";
import blockMdNodeTransformer from "@ext/markdown/elements/md/logic/blockMdNodeTransformer";
import paragraphNodeTransformer from "@ext/markdown/elements/paragraph/logic/paragraphNodeTransformer";
import preTransformTokens from "./Transformer/preTransformTokens";

import editTreeToRenderTree from "@ext/markdown/core/Parser/EditTreeToRenderTree";
import ParseError from "@ext/markdown/core/Parser/Error/ParseError";
import htmlTokenTransformer from "@ext/markdown/elements/html/logic/htmlTokenTransformer";
import htmlTagNodeTransformer from "@ext/markdown/elements/htmlTag/logic/htmlTagNodeTransformer";
import htmlTagTokenTransformer from "@ext/markdown/elements/htmlTag/logic/htmlTagTokenTransformer";
import inlinePropertyTokenTransformer from "@ext/markdown/elements/inlineProperty/edit/logic/inlinePropertyTokenTransformer";
import tableTokenTransformer from "@ext/markdown/elements/table/logic/tableTokenTransformer";
import getTocItems, { getLevelTocItemsByRenderableTree } from "@ext/navigation/article/logic/createTocItems";
import { JSONContent } from "@tiptap/core";
import inlineImageTokenTransformer from "@ext/markdown/elements/inlineImage/edit/logic/inlineImageTokenTransformer";

const katexPlugin = import("@traptitech/markdown-it-katex");

export type EditRenderableTreeNode = RenderableTreeNode | Node;

export default class MarkdownParser {
	public async parse(content: string, context?: ParserContext, requestUrl?: string): Promise<Content> {
		try {
			const schemes = this._getSchemes(context);
			const tokens = this._getTokens(content, schemes);
			const editTree = await this._editParser(tokens, schemes, context);
			const renderTree = editTreeToRenderTree(editTree, getSchema());
			const tocItems = getTocItems(getLevelTocItemsByRenderableTree((renderTree as Tag)?.children ?? []));
			return {
				editTree,
				renderTree,
				htmlValue: await this.parseToHtml(content, context, requestUrl),
				tocItems,
				linkManager: context?.getLinkManager(),
				resourceManager: context?.getResourceManager(),
				snippets: context?.snippet,
				icons: context?.icons,
			};
		} catch (e) {
			throw new ParseError(e);
		}
	}

	public async editParse(content: string, context?: ParserContext): Promise<JSONContent> {
		const schemes = this._getSchemes(context);
		const tokens = this._getTokens(content, schemes);
		return this._editParser(tokens, schemes, context);
	}

	public async parseToHtml(content: string, context?: ParserContext, requestUrl?: string): Promise<string> {
		return this.getHtml(await this.parseRenderableTreeNode(content, context), context, requestUrl);
	}

	public getHtml(renderTree: RenderableTreeNodes, context?: ParserContext, requestUrl?: string): string {
		return Markdoc.renderers.html(renderTree, {
			components: getComponentsHTML(requestUrl, context),
		});
	}

	public async parseRenderableTreeNode(
		content: string,
		context?: ParserContext,
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

	public getTokens(content: string, context: ParserContext): Token[] {
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

	private _getSchemes(context?: ParserContext): Schemes {
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
		context?: ParserContext,
	): Promise<RenderableTreeNode> {
		const variables = context?.getProp("variables") ?? {};
		const config: Config = { nodes: schemes.nodes, tags: schemes.tags, variables };
		const ast = Markdoc.parse(tokens);
		return Markdoc.transform(ast, config);
	}

	private async _editParser(tokens: Token[], schemes: Schemes, context?: ParserContext): Promise<JSONContent> {
		const prosemirrorParser = new ProsemirrorMarkdownParser(getSchema(), this._getTokenizer(), getTokens(context));

		const transformer = new ProsemirrorTransformer(
			{ ...schemes.tags, ...schemes.nodes },
			[
				fileMarkTransformer,
				htmlTagNodeTransformer,
				paragraphNodeTransformer,
				blockMdNodeTransformer,
				listItemNodeTransformer,
				taskListNodeTransformer,
				inlineCutNodeTransformer,
				diagramsNodeTransformer,
				noteNodeTransformer,
				unsupportedNodeTransformer,
				commentNodeTransformer,
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
