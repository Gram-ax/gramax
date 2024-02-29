import { JSONContent } from "@tiptap/core";
import { ParserOptions } from "../../../Parser/Parser";
import ParserContext from "../../../Parser/ParserContext/ParserContext";
import { RenderableTreeNodes, Schema, SchemaType, Tag } from "../../../render/logic/Markdoc";
import { getSquareFormatter } from "../Formatter/Formatters/getSquareFormatter";
import NodeTransformerFunc from "./NodeTransformerFunc";
import { schema } from "./schema";

type Token = any;

export class Transformer {
	constructor(private _schemes: Record<string, Schema>, private _nodeTransformerFuncs: NodeTransformerFunc[]) {}

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

		tokens = this._filterTokens(
			tokens.map((t, idx) => this._transformTokenPart1(t, idx == 0 ? null : tokens[idx - 1])),
		);

		tokens = this._filterTokens(
			tokens.map((t, idx) => this._transformTokenPart2(t, idx == 0 ? null : tokens[idx - 1])),
		);

		return tokens;
	}

	private _filterTokens(tokens: (Token | Token[])[]): Token[] {
		return tokens.flat().filter((n) => n);
	}

	private _transformTokenPart1(token: Token, previous?: Token, parent?: Token): Token | Token[] {
		if (token.type === "annotation") {
			if (!parent || parent.type !== "inline") return this._getInlineMdTokens(`{${token.info}}`);
			if (!parent.attrs) parent.attrs = {};
			if (token.meta?.attributes)
				token.meta?.attributes.forEach(({ name, value }) => (parent.attrs[name] = value));
			parent.attrs.info = token.info;
			return null;
		}

		if (token.type === "variable") return this._getInlineMdTokens(`{% ${token.info} %}`);

		if (token.tag) {
			if (token.tag === "tbody" || token.tag === "thead") return null;
			if (token.tag === "tr") {
				token.type = "tableRow" + token.type.slice(2);
				token.tag = "tableRow";
			}
			if (token.tag === "td") {
				token.type = "tableCell" + token.type.slice(2);
				token.tag = "tableCell";
			}
			if (token.tag === "th") {
				token.type = "tableHeader" + token.type.slice(2);
				token.tag = "tableHeader";
			}
		}

		if (token.type === "tag" || token.type === "tag_open" || token.type === "tag_close") {
			const attrs = {};
			if (token.meta?.attributes) token.meta?.attributes.forEach(({ name, value }) => (attrs[name] = value));
			const newNode = {
				type: token.meta.tag,
				tag: token.meta.tag,
				attrs,
			};

			if (!schema.nodes?.[newNode.type] && !schema.marks?.[newNode.type]) {
				const nodeSchema = this._schemes[newNode.type];
				const formatter = getSquareFormatter(nodeSchema);
				const tag = new Tag(newNode.type, newNode.attrs);

				if (token.type === "tag_open") {
					const content = formatter(tag, "", false, true);
					if (parent && parent.type == "inline") return this._getInlineMdOpenTokens(content);
					return [{ type: "blockMd_open", tag: "blockMd" }, ...this._getParagraphTokens(content)];
				}

				if (token.type === "tag_close") {
					const content = formatter(tag, "", true);
					if (parent && parent.type == "inline") return this._getInlineMdCloseTokens(content);
					return [...this._getParagraphTokens(content), { type: "blockMd_close", tag: "blockMd" }];
				}

				if (nodeSchema.type == SchemaType.block) {
					return this._getParagraphTokens(null, this._getInlineMdTokens(formatter(tag, "")));
				} else {
					if (!parent) return this._getParagraphTokens(null, this._getInlineMdTokens(formatter(tag, "")));
					return this._getInlineMdTokens(formatter(new Tag(newNode.type, newNode.attrs), ""));
				}
			}

			if (token.type === "tag_open") newNode.type = newNode.type + "_open";
			if (token.type === "tag_close") newNode.type = newNode.type + "_close";

			return newNode;
		}

		if (token?.children)
			token.children = this._filterTokens(
				token.children.map((t, idx) =>
					this._transformTokenPart1(t, idx == 0 ? null : token.children[idx - 1], token),
				),
			);

		return token;
	}

	private _transformTokenPart2(token: Token, previous?: Token, parent?: Token): Token | Token[] {
		if (token?.tag === "comment" && parent?.type !== "inline") {
			if (token.type === "comment_open") {
				token.type = "comment_old_open";
				token.tag = "comment_old";
				token.attrs = { mail: token.attrs.count, dateTime: token.attrs.undefined };
			}
			if (token.type === "comment_close") {
				token.type = "comment_old_close";
				token.tag = "comment_old";
			}
		}

		if (token && token?.type?.includes("_close") && previous?.type?.includes("_open")) {
			const tokenTypeName = token.type.match(/(.*?)_close/)?.[1];
			if (tokenTypeName && tokenTypeName === previous.type.match(/(.*?)_open/)?.[1]) {
				return [{ type: "paragraph_open", tag: "p" }, { type: "paragraph_close", tag: "p" }, token];
			}
		}

		if (token && token.tag === "cut" && parent?.type === "inline") {
			if (token.type === "cut_open") {
				token.type = "inlineCut_open";
				token.tag = "inlineCut";
			}
			if (token.type === "cut_close") {
				token.type = "inlineCut_close";
				token.tag = "inlineCut";
			}
		}

		if (token && token.type == "inline" && token.attrs) {
			if (previous.type !== "heading_open") {
				token.children.push(this._getInlineMdTokens(`{${token.attrs.info}}`));
			} else {
				if (!previous.attrs) previous.attrs = {};
				previous.attrs = { ...token.attrs, ...previous.attrs };
			}
		}

		if (token?.children)
			token.children = this._filterTokens(
				token.children.map((t, idx) =>
					this._transformTokenPart2(t, idx == 0 ? null : token.children[idx - 1], token),
				),
			);

		return token;
	}

	private _getParagraphTokens(content?: string, children?: any[]) {
		return [
			{ type: "paragraph_open", tag: "p" },
			{
				type: "inline",
				tag: "",
				children: children ?? [...this._getInlineMdTokens(content)],
				content: content ?? "",
			},
			{ type: "paragraph_close", tag: "p" },
		];
	}

	private _getTextToken(content: string) {
		return { type: "text", content };
	}

	private _getInlineMdOpenTokens(content?: string) {
		const openToken = { type: "inlineMd_open", tag: "inlineMd" };
		if (!content) return openToken;
		return [openToken, this._getTextToken(content)];
	}

	private _getInlineMdCloseTokens(content?: string) {
		const closeToken = { type: "inlineMd_close", tag: "inlineMd" };
		if (!content) return closeToken;
		return [this._getTextToken(content), closeToken];
	}

	private _getInlineMdTokens(content: string) {
		return [this._getInlineMdOpenTokens(), this._getTextToken(content), this._getInlineMdCloseTokens()];
	}
}
