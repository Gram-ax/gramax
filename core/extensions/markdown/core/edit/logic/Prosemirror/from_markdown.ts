import { Attrs, Mark, MarkType, Node, NodeType, Schema } from "prosemirror-model";
// import markdownit from "markdown-it";
// import { schema } from "./schema";
// import { tokens } from "./tokens";

// FIXME
type Token = any;
type MarkdownIt = any;
type Handler = (
	stat: MarkdownParseState,
	token: Token,
	tokens: Token[],
	i: number,
) => Promise<void> | void | Promise<any> | any;

function maybeMerge(a: Node, b: Node): Node | undefined {
	if (a.isText && b.isText && Mark.sameSet(a.marks, b.marks)) return (a as any).withText(a.text + b.text);
}

// Object used to track the context of a running parse.
class MarkdownParseState {
	stack: { type: NodeType; attrs: Attrs | null; content: Node[]; marks: readonly Mark[] }[];

	constructor(readonly schema: Schema, readonly tokenHandlers: { [token: string]: Handler }) {
		this.stack = [{ type: schema.topNodeType, attrs: null, content: [], marks: Mark.none }];
	}

	top() {
		return this.stack[this.stack.length - 1];
	}

	push(elt: Node) {
		if (this.stack.length) this.top().content.push(elt);
	}

	// Adds the given text to the current position in the document,
	// using the current marks as styling.
	addText(text: string) {
		if (!text) return;
		const top = this.top(),
			nodes = top.content,
			last = nodes[nodes.length - 1];
		const node = this.schema.text(text, top.marks);
		let merged;
		if (last && (merged = maybeMerge(last, node))) nodes[nodes.length - 1] = merged;
		else nodes.push(node);
	}

	// Adds the given mark to the set of active marks.
	openMark(mark: Mark) {
		const top = this.top();
		top.marks = mark.addToSet(top.marks);
	}

	// Removes the given mark from the set of active marks.
	closeMark(mark: MarkType) {
		const top = this.top();
		top.marks = mark.removeFromSet(top.marks);
	}

	async parseTokens(toks: Token[]) {
		for (let i = 0; i < toks.length; i++) {
			const tok = toks[i];
			const handler: Handler = this.tokenHandlers[tok.type];
			if (!handler) throw new Error("Token type `" + tok.type + "` not supported by Markdown parser");
			await handler(this, tok, toks, i);
		}
	}

	// Add a node at the current position.
	addNode(type: NodeType, attrs: Attrs | null, content?: readonly Node[]) {
		const top = this.top();
		const node = type.createAndFill(attrs, content, top ? top.marks : []);

		if (!node) return null;
		this.push(node);
		return node;
	}

	// Wrap subsequent content in a node of the given type.
	openNode(type: NodeType, attrs: Attrs | null) {
		this.stack.push({ type: type, attrs: attrs, content: [], marks: Mark.none });
	}

	// Close and return the node that is currently on top of the stack.
	closeNode() {
		const info = this.stack.pop();
		return this.addNode(info.type, info.attrs, info.content);
	}
}

async function attrs(spec: ParseSpec, token: Token, tokens: Token[], i: number) {
	if (spec.getAttrs) return { ...(await spec.getAttrs(token, tokens, i)) };
	// For backwards compatibility when `attrs` is a Function
	else if (spec.attrs instanceof Function) return { ...spec.attrs(token) };
	else return { ...spec.attrs };
}

// Code content is represented as a single token with a `content`
// property in Markdown-it.
const nodesWithoutCloseToken = ["code_inline", "code_block", "fence", "taskItem"];
function noCloseToken(spec: ParseSpec, type: string) {
	return spec.noCloseToken || nodesWithoutCloseToken.includes(type);
}

function withoutTrailingNewline(str: string) {
	return str[str.length - 1] == "\n" ? str.slice(0, str.length - 1) : str;
}

function noOp() {
	//
}

function tokenHandlers(schema: Schema, tokens: { [token: string]: ParseSpec }) {
	const handlers: { [token: string]: Handler } = Object.create(null);

	for (const type in tokens) {
		const spec = tokens[type];
		if (spec.block) {
			const nodeType = (schema as any).nodeType(spec.block);
			if (noCloseToken(spec, type)) {
				handlers[type] = async (state, tok, tokens, i) => {
					state.openNode(nodeType, await attrs(spec, tok, tokens, i));
					state.addText(withoutTrailingNewline(tok.content));
					state.closeNode();
				};
			} else {
				handlers[type + "_open"] = async (state, tok, tokens, i) =>
					state.openNode(nodeType, await attrs(spec, tok, tokens, i));

				handlers[type + "_close"] = (state) => state.closeNode();
			}
		} else if (spec.node) {
			const nodeType = (schema as any).nodeType(spec.node);
			handlers[type] = async (state, tok, tokens, i) =>
				state.addNode(nodeType, await attrs(spec, tok, tokens, i));
		} else if (spec.mark) {
			const markType = schema.marks[spec.mark];
			if (noCloseToken(spec, type)) {
				handlers[type] = async (state, tok, tokens, i) => {
					state.openMark(markType.create(await attrs(spec, tok, tokens, i)));
					state.addText(withoutTrailingNewline(tok.content));
					state.closeMark(markType);
				};
			} else {
				handlers[type + "_open"] = async (state, tok, tokens, i) =>
					state.openMark(markType.create(await attrs(spec, tok, tokens, i)));
				handlers[type + "_close"] = (state) => state.closeMark(markType);
			}
		} else if (spec.ignore) {
			if (noCloseToken(spec, type)) {
				handlers[type] = noOp;
			} else {
				handlers[type + "_open"] = noOp;
				handlers[type + "_close"] = noOp;
			}
		} else {
			throw new RangeError("Unrecognized parsing spec " + JSON.stringify(spec));
		}
	}

	handlers.text = (state, tok) => state.addText(tok.content);
	handlers.inline = async (state, tok) => await state.parseTokens(tok.children);
	handlers.softbreak = handlers.softbreak || ((state) => state.addText(" "));

	return handlers;
}

export interface ParseSpec {
	/// This token maps to a single node, whose type can be looked up
	/// in the schema under the given name. Exactly one of `node`,
	/// `block`, or `mark` must be set.
	node?: string;

	/// This token (unless `noCloseToken` is true) comes in `_open`
	/// and `_close` variants (which are appended to the base token
	/// name provides a the object property), and wraps a block of
	/// content. The block should be wrapped in a node of the type
	/// named to by the property's value. If the token does not have
	/// `_open` or `_close`, use the `noCloseToken` option.
	block?: string;

	/// This token (again, unless `noCloseToken` is true) also comes
	/// in `_open` and `_close` variants, but should add a mark
	/// (named by the value) to its content, rather than wrapping it
	/// in a node.
	mark?: string;

	/// Attributes for the node or mark. When `getAttrs` is provided,
	/// it takes precedence.
	attrs?: Attrs | null;

	/// A function used to compute the attributes for the node or mark
	/// that takes a [markdown-it
	/// token](https://markdown-it.github.io/markdown-it/#Token) and
	/// returns an attribute object.
	getAttrs?: (token: Token, tokenStream: Token[], index: number) => Attrs | Promise<Attrs>;

	/// Indicates that the [markdown-it
	/// token](https://markdown-it.github.io/markdown-it/#Token) has
	/// no `_open` or `_close` for the nodes. This defaults to `true`
	/// for `code_inline`, `code_block` and `fence`.
	noCloseToken?: boolean;

	/// When true, ignore content for the matched token.
	ignore?: boolean;
}

/// A configuration of a Markdown parser. Such a parser uses
/// [markdown-it](https://github.com/markdown-it/markdown-it) to
/// tokenize a file, and then runs the custom rules it is given over
/// the tokens to create a ProseMirror document tree.
export class MarkdownParser {
	/// @internal
	tokenHandlers: { [token: string]: (stat: MarkdownParseState, token: Token, tokens: Token[], i: number) => void };

	/// Create a parser with the given configuration. You can configure
	/// the markdown-it parser to parse the dialect you want, and provide
	/// a description of the ProseMirror entities those tokens map to in
	/// the `tokens` object, which maps token names to descriptions of
	/// what to do with them. Such a description is an object, and may
	/// have the following properties:
	constructor(
		/// The parser's document schema.
		readonly schema: Schema,
		/// This parser's markdown-it tokenizer.
		readonly tokenizer: MarkdownIt,
		/// The value of the `tokens` object used to construct this
		/// parser. Can be useful to copy and modify to base other parsers
		/// on.
		readonly tokens: { [name: string]: ParseSpec },
	) {
		this.tokenHandlers = tokenHandlers(schema, tokens);
	}

	/// Parse a string as [CommonMark](http://commonmark.org/) markup,
	/// and create a ProseMirror document as prescribed by this parser's
	/// rules.
	async parse(content: string | Token[]) {
		const state = new MarkdownParseState(this.schema, this.tokenHandlers);
		let doc;
		await state.parseTokens(typeof content == "string" ? this.tokenizer.parse(content, {}) : content);
		do {
			doc = state.closeNode();
		} while (state.stack.length);
		return doc || this.schema.topNodeType.createAndFill();
	}
}

// function listIsTight(tokens: readonly Token[], i: number) {
// 	while (++i < tokens.length) if (tokens[i].type != "list_item_open") return tokens[i].hidden;
// 	return false;
// }

// export const defaultMarkdownParser = new MarkdownParser(schema, markdownit("commonmark", { html: false }), tokens);
