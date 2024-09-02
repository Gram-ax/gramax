import MdParser from "@ext/markdown/core/Parser/MdParser/MdParser";
import { Mark, Node } from "prosemirror-model";

export type NodeSerializerSpec = (
	state: MarkdownSerializerState,
	node: Node,
	parent: Node,
	index: number,
) => void | Promise<void>;

export type MarkSerializerSpec = {
	/// The string that should appear before a piece of content marked
	/// by this mark, either directly or as a function that returns an
	/// appropriate string.
	open:
		| string
		| ((state: MarkdownSerializerState, mark: Mark, parent: Node, index: number) => Promise<string> | string);
	/// The string that should appear after a piece of content marked by
	/// this mark.
	close:
		| string
		| ((state: MarkdownSerializerState, mark: Mark, parent: Node, index: number) => Promise<string> | string);
	/// When `true`, this indicates that the order in which the mark's
	/// opening and closing syntax appears relative to other mixable
	/// marks can be varied. (For example, you can say `**a *b***` and
	/// `*a **b***`, but not `` `a *b*` ``.)
	mixable?: boolean;
	/// When enabled, causes the serializer to move enclosing whitespace
	/// from inside the marks to outside the marks. This is necessary
	/// for emphasis marks as CommonMark does not permit enclosing
	/// whitespace inside emphasis marks, see:
	/// http:///spec.commonmark.org/0.26/#example-330
	expelEnclosingWhitespace?: boolean;
	/// Can be set to `false` to disable character escaping in a mark. A
	/// non-escaping mark has to have the highest precedence (must
	/// always be the innermost mark).
	escape?: boolean;
};

/// A specification for serializing a ProseMirror document as
/// Markdown/CommonMark text.
export class MarkdownSerializer {
	/// Construct a serializer with the given configuration. The `nodes`
	/// object should map node names in a given schema to function that
	/// take a serializer state and such a node, and serialize the node.
	constructor(
		/// The node serializer functions for this serializer.
		readonly nodes: { [node: string]: NodeSerializerSpec },
		/// The mark serializer info.
		readonly marks: { [mark: string]: MarkSerializerSpec },
		readonly options: {
			/// Extra characters can be added for escaping. This is passed
			/// directly to String.replace(), and the matching characters are
			/// preceded by a backslash.
			escapeExtraCharacters?: RegExp;
		} = {},
	) {}

	/// Serialize the content of the given node to
	/// [CommonMark](http://commonmark.org/).
	async serialize(
		content: Node,
		options: {
			/// Whether to render lists in a tight style. This can be overridden
			/// on a node level by specifying a tight attribute on the node.
			/// Defaults to false.
			tightLists?: boolean;
		} = {},
		delim = "",
	) {
		options = Object.assign(this.options, options);
		const state = new MarkdownSerializerState(this.nodes, this.marks, options, delim);
		await state.renderContent(content);
		return state.out;
	}
}
export class MarkdownSerializerState {
	/// @internal
	delim = "";
	/// @internal
	out = "";
	/// @internal
	closed: Node | null = null;
	/// @internal
	inAutolink: boolean | undefined = undefined;
	/// @internal
	atBlockStart = false;
	/// @internal
	inTightList = false;

	/// @internal
	constructor(
		/// @internal
		readonly nodes: { [node: string]: NodeSerializerSpec },
		/// @internal
		readonly marks: { [mark: string]: MarkSerializerSpec },
		/// The options passed to the serializer.
		readonly options: { tightLists?: boolean; escapeExtraCharacters?: RegExp },

		delim: string,
	) {
		if (typeof this.options.tightLists == "undefined") this.options.tightLists = false;
		this.delim = delim ?? "";
	}

	/// @internal
	flushClose(size = 2) {
		if (this.closed) {
			if (!this.atBlank()) this.out += "\n";
			if (size > 1) {
				let delimMin = this.delim;
				const trim = /\s+$/.exec(delimMin);
				if (trim) delimMin = delimMin.slice(0, delimMin.length - trim[0].length);
				for (let i = 1; i < size; i++) this.out += delimMin + "\n";
			}
			this.closed = null;
		}
	}

	/// Render a block, prefixing each line with `delim`, and the first
	/// line in `firstDelim`. `node` should be the node that is closed at
	/// the end of the block, and `f` is a function that renders the
	/// content of the block.
	async wrapBlock(delim: string, firstDelim: string | null, node: Node, f: () => void | Promise<void>) {
		const old = this.delim;
		this.write(firstDelim || delim);
		this.delim += delim;
		await f();
		this.delim = old;
		this.closeBlock(node);
	}

	/// @internal
	atBlank() {
		return /(^|\n)$/.test(this.out);
	}

	/// Ensure the current content ends with a newline.
	ensureNewLine() {
		if (!this.atBlank()) this.out += "\n";
	}

	/// Prepare the state for writing output (closing closed paragraphs,
	/// adding delimiters, and so on), and then optionally add content
	/// (unescaped) to the output.
	write(content?: string) {
		this.flushClose();
		if (this.delim && this.atBlank()) this.out += this.delim;
		if (content) this.out += content;
	}

	/// Close the block for the given node.
	closeBlock(node: Node) {
		this.closed = node;
	}

	/// Add the given text to the document. When escape is not `false`,
	/// it will be escaped.
	text(text: string, escape = true) {
		const lines = text.split("\n");
		for (let i = 0; i < lines.length; i++) {
			this.write();
			// Escape exclamation marks in front of links
			// eslint-disable-next-line no-useless-escape
			if (!escape && lines[i][0] == "[" && /(^|[^\\])\!$/.test(this.out))
				this.out = this.out.slice(0, this.out.length - 1) + "\\!";
			this.out += escape ? this.esc(lines[i], this.atBlockStart) : lines[i];
			if (i != lines.length - 1) this.out += "\n";
		}
	}

	/// Render the given node as a block.
	async render(node: Node, parent: Node, index: number) {
		if (typeof parent == "number") throw new Error("!");
		if (!this.nodes[node.type.name])
			throw new Error("Token type `" + node.type.name + "` not supported by Markdown renderer");
		await this.nodes[node.type.name](this, node, parent, index);
		if (node.type.name === "table_simple") this.out = formatTable(this.out);
	}

	/// Render the contents of `parent` as block nodes.
	async renderContent(parent: Node) {
		// parent.forEach((node, _, i) => this.render(node, parent, i));
		for (let i = 0; i < parent.childCount; i++) {
			const child = parent.child(i);
			await this.render(child, parent, i);
		}
	}

	/// Render the contents of `parent` as inline content.
	async renderInline(parent: Node) {
		this.atBlockStart = true;
		const active: Mark[] = [];
		let trailing = "";
		const progress = async (node: Node | null, offset: number, index: number) => {
			let marks = node ? node.marks : [];

			// Remove marks from `hard_break` that are the last node inside
			// that mark to prevent parser edge cases with new lines just
			// before closing marks.
			// (FIXME it'd be nice if we had a schema-agnostic way to
			// identify nodes that serialize as hard breaks)
			if (node && node.type.name === "hard_break")
				marks = marks.filter((m) => {
					if (index + 1 == parent.childCount) return false;
					const next = parent.child(index + 1);
					return m.isInSet(next.marks) && (!next.isText || /\S/.test(next.text));
				});

			let leading = trailing;
			trailing = "";
			// If whitespace has to be expelled from the node, adjust
			// leading and trailing accordingly.
			if (
				node &&
				node.isText &&
				marks.some((mark) => {
					const info = this.marks[mark.type.name];
					return info && info.expelEnclosingWhitespace;
				})
			) {
				const [, lead, inner, trail] = /^(\s*)(.*?)(\s*)$/m.exec(node.text);
				leading += lead;
				trailing = trail;
				if (lead || trail) {
					node = inner ? (node as any).withText(inner) : null;
					if (!node) marks = active;
				}
			}

			const inner = marks.length ? marks[marks.length - 1] : null;
			const noEsc = inner && this.marks[inner.type.name].escape === false;
			const len = marks.length - (noEsc ? 1 : 0);

			// Try to reorder 'mixable' marks, such as em and strong, which
			// in Markdown may be opened and closed in different order, so
			// that order of the marks for the token matches the order in
			// active.
			outer: for (let i = 0; i < len; i++) {
				const mark = marks[i];
				if (!this.marks[mark.type.name].mixable) break;
				for (let j = 0; j < active.length; j++) {
					const other = active[j];
					if (!this.marks[other.type.name].mixable) break;
					if (mark.eq(other)) {
						if (i > j)
							marks = marks
								.slice(0, j)
								.concat(mark)
								.concat(marks.slice(j, i))
								.concat(marks.slice(i + 1, len));
						else if (j > i)
							marks = marks
								.slice(0, i)
								.concat(marks.slice(i + 1, j))
								.concat(mark)
								.concat(marks.slice(j, len));
						continue outer;
					}
				}
			}

			// Find the prefix of the mark set that didn't change
			let keep = 0;
			while (keep < Math.min(active.length, len) && marks[keep].eq(active[keep])) ++keep;

			// Close the marks that need to be closed
			while (keep < active.length) this.text(await this.markString(active.pop(), false, parent, index), false);

			// Output any previously expelled trailing whitespace outside the marks
			if (leading) this.text(leading);

			// Open the marks that need to be opened
			if (node) {
				while (active.length < len) {
					const add = marks[active.length];
					active.push(add);
					this.text(await this.markString(add, true, parent, index), false);
				}

				// Render the node. Special case code marks, since their content
				// may not be escaped.
				if (noEsc && node.isText)
					this.text(
						this.markString(inner, true, parent, index) +
							node.text +
							this.markString(inner, false, parent, index + 1),
						false,
					);
				else await this.render(node, parent, index);
			}
		};
		// parent.forEach(progress);
		for (let i = 0, p = 0; i < parent.childCount; i++) {
			const child = parent.child(i);
			await progress(child, p, i);
			p += child.nodeSize;
		}
		await progress(null, 0, parent.childCount);
		this.atBlockStart = false;
	}

	/// Render a node's content as a list. `delim` should be the extra
	/// indentation added to all lines except the first in an item,
	/// `firstDelim` is a function going from an item index to a
	/// delimiter for the first line of the item.
	async renderList(node: Node, delim: (index: number) => string, firstDelim: (index: number) => string) {
		if (this.closed && this.closed.type == node.type) this.flushClose(3);
		else if (this.inTightList) this.flushClose(1);

		const isTight = typeof node.attrs.tight != "undefined" ? node.attrs.tight : this.options.tightLists;
		const prevTight = this.inTightList;
		this.inTightList = isTight;

		// node.forEach((child, _, i) => {
		// 	if (i && isTight) this.flushClose(1);
		// 	this.wrapBlock(delim(i), firstDelim(i), node, async () => await this.render(child, node, i));
		// });

		for (let i = 0; i < node.childCount; i++) {
			const child = node.child(i);
			if (i && isTight) this.flushClose(1);
			await this.wrapBlock(delim(i), firstDelim(i), node, async () => await this.render(child, node, i));
		}

		this.inTightList = prevTight;
	}

	/// Escape the given string so that it can safely appear in Markdown
	/// content. If `startOfLine` is true, also escape characters that
	/// have special meaning only at the start of the line.
	esc(str: string, startOfLine = false) {
		// eslint-disable-next-line no-useless-escape
		str = str.replace(/[`*\\~\[\]_\$]/g, (m, i) =>
			m == "_" && i > 0 && i + 1 < str.length && str[i - 1].match(/\w/) && str[i + 1].match(/\w/) ? m : "\\" + m,
		);
		if (startOfLine) str = str.replace(/^[#\-*+>]/, "\\$&").replace(/^(\s*\d+)\./, "$1\\.");
		if (this.options.escapeExtraCharacters) str = str.replace(this.options.escapeExtraCharacters, "\\$&");
		return str;
	}

	/// @internal
	quote(str: string) {
		const wrap = str.indexOf('"') == -1 ? '""' : str.indexOf("'") == -1 ? "''" : "()";
		return wrap[0] + str + wrap[1];
	}

	/// Repeat the given string `n` times.
	repeat(str: string, n: number) {
		let out = "";
		for (let i = 0; i < n; i++) out += str;
		return out;
	}

	/// Get the markdown string for a given opening or closing mark.
	markString(mark: Mark, open: boolean, parent: Node, index: number) {
		const info = this.marks[mark.type.name];
		const value = open ? info.open : info.close;
		return typeof value == "string" ? value : value(this, mark, parent, index);
	}

	/// Get leading and trailing whitespace from a string. Values of
	/// leading or trailing property of the return object will be undefined
	/// if there is no match.
	getEnclosingWhitespace(text: string): { leading?: string; trailing?: string } {
		return {
			leading: (text.match(/^(\s+)/) || [undefined])[0],
			trailing: (text.match(/(\s+)$/) || [undefined])[0],
		};
	}
}

export const formatTable = (table: string) => {
	table = new MdParser().backParse(table);
	const lines = table.trim().split("\n");

	const headers = lines[0]
		.split("|")
		.slice(1, -1)
		.map((header) => header.trim());

	const dataLines = lines.slice(2);

	const data = dataLines.map((line) => {
		return line.split("|").slice(1, -1);
	});

	const columnWidths = headers.map((header, index) => {
		return Math.max(1, header.length, ...data.map((row) => row[index]?.length || 0));
	});

	const formattedHeaders = headers.map((header, index) => header.padEnd(columnWidths[index])).join(" | ");

	const separator = columnWidths.map((width) => "-".repeat(width)).join("-|-");

	const formattedRows = data.map((row) => {
		return row.map((cell, index) => (cell || "").padEnd(columnWidths[index])).join(" | ");
	});

	const formattedTable =
		`| ${formattedHeaders} |\n|-${separator}-|\n` + formattedRows.map((row) => `| ${row} |`).join("\n");

	return formattedTable;
};
