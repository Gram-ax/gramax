import AstDiffTransformer from "@ext/markdown/elements/diff/logic/astTransformer/AstDiffTransofrmer";
import { DiffLine } from "@ext/markdown/elements/diff/logic/model/DiffLine";
import { ProseMirrorDiffLine } from "@ext/markdown/elements/diff/logic/model/ProseMirrorDiffLine";
import { JSONContent } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { Decoration } from "prosemirror-view";

export default class ProsemirrorAstDiffTransformer extends AstDiffTransformer {
	private _oldMatrix: number[][] = [];
	private _newMatrix: number[][] = [];

	protected declare _oldAst: Node;
	protected declare _newAst: Node;

	private _oldStrings: string[] = [];
	private _newStrings: string[] = [];

	constructor(oldAst: Node, newAst: Node) {
		super(oldAst, newAst);
	}

	getStrings(): { oldStrings: string[]; newStrings: string[] } {
		if (this._oldStrings.length > 0 && this._newStrings.length > 0)
			return { oldStrings: this._oldStrings, newStrings: this._newStrings };

		this._descendants(this._oldAst, (node, pos) => this._astWalker(node, pos, this._oldStrings, this._oldMatrix));
		this._descendants(this._newAst, (node, pos) => this._astWalker(node, pos, this._newStrings, this._newMatrix));

		return { oldStrings: this._oldStrings, newStrings: this._newStrings };
	}

	getAstPos(findIn: "old" | "new", arrayIdx: number, charIdx: number): number {
		return findIn === "old" ? this._oldMatrix[arrayIdx][charIdx] : this._newMatrix[arrayIdx][charIdx];
	}

	convertToProseMirrorDiffLine(diffLine: DiffLine): ProseMirrorDiffLine {
		if (diffLine.type !== "modified") return diffLine as ProseMirrorDiffLine;

		const oldContent = this._oldAst.slice(diffLine.oldPos.from, diffLine.oldPos.to + 1).content.toJSON(); // +1 to include the last character

		const oldDecorations: Decoration[] = diffLine.diff.deletedPartPositions.map((pos) => {
			const SINGLE_PARAGRAPH_DOC_POS_OFFSET = 1;
			const paragraphStart = diffLine.oldPos.from;

			return Decoration.inline(
				pos.from - paragraphStart + SINGLE_PARAGRAPH_DOC_POS_OFFSET,
				pos.to - paragraphStart + SINGLE_PARAGRAPH_DOC_POS_OFFSET + 1, // +1 to include the last character
				{ class: "deleted-text" },
			);
		});

		return {
			...diffLine,
			oldContent: ProsemirrorAstDiffTransformer._getOldDiffViewNode(oldContent),
			oldDecorations,
		};
	}

	private _astWalker(node: Node, pos: number, strings: string[], matrix: number[][]) {
		if (node.type.name === "paragraph" || node.type.name === "heading") {
			const string = node.textContent;
			if (!string) {
				strings.push("");
				matrix.push([pos]);
				return;
			}

			strings.push(string);
			const positions: number[] = [];
			for (let i = 0; i < string.length; i++) {
				positions.push(pos + 1 + i); // +1 because of paragraph and text nodes offset
			}

			matrix.push(positions);
		}
	}

	private static _getOldDiffViewNode(content: JSONContent[]): JSONContent {
		return { type: "doc", content: [{ type: "paragraph", content }] };
	}

	private _descendants(node: Node, callback: (node: Node, pos: number, parentNode: Node) => void) {
		const find = (node: Node, pos: number, parentNode: Node) => {
			callback(node, pos, parentNode);
			if (node?.content)
				node.content.forEach((n, offset) => {
					find(n, pos + offset + 1, node);
				});
		};

		node.content.forEach((n, offset) => {
			find(n, offset, node);
		});
	}
}
