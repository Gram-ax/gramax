import TokenTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/TokenTransformerFunc";
import { JSONContent } from "@tiptap/core";
import { ParserOptions } from "../../../Parser/Parser";
import ParserContext from "../../../Parser/ParserContext/ParserContext";
import { RenderableTreeNodes, Schema, SchemaType, Tag } from "../../../render/logic/Markdoc";
import { getSquareFormatter } from "../Formatter/Formatters/getSquareFormatter";
import NodeTransformerFunc from "./NodeTransformerFunc";
import { getSchema } from "./schema";

type Token = any;

export class Transformer {
	constructor(
		private _schemes: Record<string, Schema>,
		private _nodeTransformerFuncs: NodeTransformerFunc[],
		private _tokenTransformerFuncs: TokenTransformerFunc[],
	) {}

	async transformMdComponents(
		node: JSONContent,
		renderer: (
			content: string,
			context?: ParserContext,
			parserOptions?: ParserOptions,
		) => Promise<RenderableTreeNodes>,
		context?: ParserContext,
	): Promise<JSONContent> {
		if (node?.content)
			node.content = await Promise.all(
				node.content.map(async (n) => await this.transformMdComponents(n, renderer, context)),
			);
		if (node?.marks) {
			const inlineMdIndex = node.marks.findIndex((mark) => mark.type === "inlineMd");
			if (inlineMdIndex !== -1) {
				node = {
					type: "inlineMd_component",
					attrs: {
						tag: await renderer(node.text, context, { isOneElement: true, isBlock: false }),
						text: node.text,
					},
				};
			}
		}
		if (node.type == "blockMd") {
			node = {
				type: "blockMd_component",
				attrs: {
					text: node.content[0].text,
					tag: await renderer(node.content[0].text, context, { isOneElement: true, isBlock: true }),
				},
				content: node.content,
			};
		}

		return node;
	}

	async transformTree(
		node: JSONContent,
		previousNode?: JSONContent,
		nextNode?: JSONContent,
		context?: ParserContext,
		count?: number,
	): Promise<JSONContent> {
		if (node?.content) {
			const newContent = [];
			for (let i = 0; i < node.content.length; i++) {
				const value = node.content[i];
				newContent.push(
					await this.transformTree(
						value,
						i == 0 ? null : node.content[i - 1],
						i == node.content.length - 1 ? null : node.content[i + 1],
						context,
						count + i + 1,
					),
				);
			}
			node.content = newContent.flat().filter((n) => n);
		}

		for (const nodeTransformerFunc of this._nodeTransformerFuncs) {
			const res = await nodeTransformerFunc(node, previousNode, nextNode, context, count);
			if (res && res.isSet) return res.value;
		}

		return node;
	}

	transformToken(tokens: Token[]): Token[] {
		if (tokens.length === 0) {
			return [
				{ type: "paragraph_open", tag: "p" },
				{ type: "paragraph_close", tag: "p" },
			];
		}

		const duplicate = [...this._tokenTransformerFuncs];

		this._tokenTransformerFuncs.unshift(this._tagTokenTransformer);
		this._tokenTransformerFuncs.unshift(this._variableTokenTransformer);
		this._tokenTransformerFuncs.unshift(this._annotationTokenTransformer);

		tokens = this._filterTokens(
			tokens.map((t, idx) => this._transformToken(tokens, idx, t, idx == 0 ? null : tokens[idx - 1])),
		);

		this._tokenTransformerFuncs = duplicate;
		this._tokenTransformerFuncs.unshift(this._openCloseTokenTransformer);
		this._tokenTransformerFuncs.push(this._inlineTokenTransformer);

		tokens = this._filterTokens(
			tokens.map((t, idx) => this._transformToken(tokens, idx, t, idx == 0 ? null : tokens[idx - 1])),
		);

		return tokens;
	}

	private _filterTokens(tokens: (Token | Token[])[]): Token[] {
		return tokens.flat().filter((n) => n);
	}

	private _variableTokenTransformer: TokenTransformerFunc = ({ token, transformer }) => {
		if (token.type === "variable") return transformer.getInlineMdTokens(`{% ${token.info} %}`);
	};

	private _annotationTokenTransformer: TokenTransformerFunc = ({ token, transformer, parent }) => {
		if (token.type === "annotation") {
			if (!parent || parent.type !== "inline") return transformer.getInlineMdTokens(`{${token.info}}`);
			if (!parent.attrs) parent.attrs = {};
			if (token.meta?.attributes)
				token.meta?.attributes.forEach(({ name, value }) => (parent.attrs[name] = value));
			parent.attrs.info = token.info;
			return null;
		}
	};

	private _openCloseTokenTransformer: TokenTransformerFunc = ({ token, previous }) => {
		if (token && token?.type?.includes("_close") && previous?.type?.includes("_open")) {
			const tokenTypeName = token.type.match(/(.*?)_close/)?.[1];
			if (
				tokenTypeName &&
				tokenTypeName !== "tableRow" &&
				tokenTypeName === previous.type.match(/(.*?)_open/)?.[1]
			) {
				return [{ type: "paragraph_open", tag: "p" }, { type: "paragraph_close", tag: "p" }, token];
			}
		}
	};

	private _inlineTokenTransformer: TokenTransformerFunc = ({ token, transformer, previous }) => {
		if (token && token.type == "inline" && token.attrs) {
			if (previous.type !== "heading_open") {
				token.children.push(transformer.getInlineMdTokens(`{${token.attrs.info}}`));
			} else {
				if (!previous.attrs) previous.attrs = {};
				previous.attrs = { ...token.attrs, ...previous.attrs };
			}
		}
	};

	private _tagTokenTransformer: TokenTransformerFunc = ({ token, transformer, parent }) => {
		if (token.type === "tag" || token.type === "tag_open" || token.type === "tag_close") {
			const attrs = {};
			if (token.meta?.attributes) token.meta?.attributes.forEach(({ name, value }) => (attrs[name] = value));
			const newNode = {
				type: token.meta.tag,
				tag: token.meta.tag,
				attrs,
			};

			const schema = getSchema();
			if (!schema.nodes?.[newNode.type] && !schema.marks?.[newNode.type]) {
				const nodeSchema = transformer._schemes[newNode.type];
				const formatter = getSquareFormatter(nodeSchema);
				const tag = new Tag(newNode.type, newNode.attrs);
				if (token.type === "tag_open") {
					const content = formatter(tag, "", false, true);
					if (parent && parent.type == "inline") return transformer.getInlineMdOpenTokens(content);
					return [
						{ type: "paragraph_open", tag: "p" },
						{ type: "blockMd_open", tag: "blockMd" },
						...transformer.getParagraphTokens(content),
					];
				}

				if (token.type === "tag_close") {
					const content = formatter(tag, "", true);
					if (parent && parent.type == "inline") return transformer.getInlineMdCloseTokens(content);
					return [
						...transformer.getParagraphTokens(content),
						{ type: "blockMd_close", tag: "blockMd" },
						{ type: "paragraph_close", tag: "p" },
					];
				}

				if (
					nodeSchema.type == SchemaType.block ||
					(newNode.tag === "formula" && newNode.attrs["content"].includes("$$"))
				) {
					if (!parent)
						return transformer.getParagraphTokens(
							null,
							transformer.getBlockMdTokens(
								transformer.getParagraphTokens(null, [this.getTextToken(formatter(tag, ""))]),
							),
						);

					return transformer.getBlockMdTokens(
						transformer.getParagraphTokens(null, [this.getTextToken(formatter(tag, ""))]),
					);
				} else {
					if (!parent)
						return transformer.getParagraphTokens(null, transformer.getInlineMdTokens(formatter(tag, "")));
					return transformer.getInlineMdTokens(formatter(tag, ""));
				}
			}
			if (token.type === "tag_open") newNode.type = newNode.type + "_open";
			if (token.type === "tag_close") newNode.type = newNode.type + "_close";

			if (transformer._schemes[newNode.type]?.type == SchemaType.block) {
				if (parent) return transformer.getBlockMdTokens(newNode);
			}

			return newNode;
		}
	};

	private _transformToken(
		tokens: Token[],
		id: number,
		token: Token,
		previous?: Token,
		parent?: Token,
	): Token | Token[] {
		for (const transformFunc of this._tokenTransformerFuncs) {
			const result = transformFunc({ id, tokens, token, previous, parent, transformer: this });
			if (result !== undefined) {
				token = result;
				return token;
			}
		}

		if (token?.children) {
			token.children = this._filterTokens(
				token.children.map((childToken, idx) =>
					this._transformToken(
						token.children,
						idx,
						childToken,
						idx === 0 ? null : token.children[idx - 1],
						token,
					),
				),
			);
		}

		return token;
	}

	public getParagraphTokens(content?: string, children?: any[]) {
		return [
			{ type: "paragraph_open", tag: "p" },
			{
				type: "inline",
				tag: "",
				children: children ?? [...this.getInlineMdTokens(content)],
				content: content ?? "",
			},
			{ type: "paragraph_close", tag: "p" },
		];
	}

	public getTextToken(content: string) {
		return { type: "text", content };
	}

	public getInlineMdOpenTokens(content?: string) {
		const openToken = { type: "inlineMd_open", tag: "inlineMd" };
		if (!content) return openToken;
		return [openToken, this.getTextToken(content)];
	}

	public getInlineMdCloseTokens(content?: string) {
		const closeToken = { type: "inlineMd_close", tag: "inlineMd" };
		if (!content) return closeToken;
		return [this.getTextToken(content), closeToken];
	}

	public getInlineMdTokens(content: string) {
		return [this.getInlineMdOpenTokens(), this.getTextToken(content), this.getInlineMdCloseTokens()];
	}

	public getBlockMdTokens(children) {
		return [{ type: "blockMd_open", tag: "blockMd" }, children, { type: "blockMd_close", tag: "blockMd" }];
	}
}
