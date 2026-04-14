import type { FileChild } from "@ext/wordExport/types";
import type { JSONContent } from "@tiptap/core";
import type { IParagraphOptions } from "docx";
import type { AddOptionsWord } from "../../../../wordExport/options/WordTypes";
import type { WordSerializerState } from "../../../../wordExport/WordExportState";
import type { Tag } from "../../../core/render/logic/Markdoc";

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
