import { IParagraphOptions } from "docx";
import { FileChild } from "docx/build/file/file-child";
import { WordSerializerState } from "../../../../wordExport/WordExportState";
import { AddOptionsWord } from "../../../../wordExport/options/WordTypes";
import { Tag } from "../../../core/render/logic/Markdoc";
import { JSONContent } from "@tiptap/core";

export class WordListRenderer {
	static async renderList(
		state: WordSerializerState,
		tag: Tag | JSONContent,
		addOption?: IParagraphOptions,
	): Promise<FileChild[]> {
		const children = "children" in tag ? tag.children : tag.content;
		return (
			await Promise.all(
				children.map(async (child) => {
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
		child: Tag | JSONContent,
		addOption: IParagraphOptions,
	): Promise<FileChild[]> {
		return (await state.renderBlock(child, addOption as AddOptionsWord)).flat();
	}
}
