import { IParagraphOptions } from "docx";
import { FileChild } from "docx/build/file/file-child";
import { WordSerializerState } from "../../../../wordExport/WordExportState";
import { AddOptionsWord } from "../../../../wordExport/WordTypes";
import { Tag } from "../../../core/render/logic/Markdoc";

export class WordListRenderer {
	static async renderList(state: WordSerializerState, tag: Tag, addOption?: IParagraphOptions): Promise<FileChild[]> {
		return (
			await Promise.all(
				tag.children.map(async (child) => {
					if (!child || typeof child === "string") return;
					return (await state.renderBlock(child, addOption as AddOptionsWord)).flat();
				}),
			)
		)
			.flat()
			.filter((val) => val);
	}
}
