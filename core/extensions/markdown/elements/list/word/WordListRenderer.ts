import { IParagraphOptions } from "docx";
import { FileChild } from "docx/build/file/file-child";
import { WordSerializerState } from "../../../../wordExport/WordExportState";
import { AddOptionsWord } from "../../../../wordExport/options/WordTypes";
import { Tag } from "../../../core/render/logic/Markdoc";

export class WordListRenderer {
	static async renderList(state: WordSerializerState, tag: Tag, addOption?: IParagraphOptions): Promise<FileChild[]> {
		return (
			await Promise.all(
				tag.children.map(async (child) => {
					if (!child || typeof child === "string") return;
					return await WordListRenderer._getRenderedBlock(state, child, addOption);
				}),
			)
		)
			.flat()
			.filter((val) => val);
	}

	private static async _getRenderedBlock(
		state: WordSerializerState,
		child: Tag,
		addOption: IParagraphOptions,
	): Promise<FileChild[]> {
		return (await state.renderBlock(child, addOption as AddOptionsWord)).flat();
	}
}
