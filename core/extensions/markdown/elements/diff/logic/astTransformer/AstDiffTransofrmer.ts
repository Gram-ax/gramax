import { Pos } from "@ext/markdown/elements/diff/logic/model/DiffLine";

export type AstComment = Record<string, Pos>;

export default abstract class AstDiffTransformer {
	protected _oldAst: any;
	protected _newAst: any;

	constructor(oldAst: any, newAst: any) {
		this._oldAst = oldAst;
		this._newAst = newAst;
	}

	abstract getStrings(): { oldStrings: string[]; newStrings: string[] };
	abstract getAstPos(findIn: "old" | "new", arrayIdx: number, charIdx: number): number;
	abstract getParagraphComments(): { oldParagraphComments: AstComment; newParagraphComments: AstComment };
}
