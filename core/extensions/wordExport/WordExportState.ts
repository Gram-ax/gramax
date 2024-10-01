import { ParagraphChild, TextRun } from "docx";
import { FileChild } from "docx/build/file/file-child";
import ParserContext from "../markdown/core/Parser/ParserContext/ParserContext";
import { Tag } from "../markdown/core/render/logic/Markdoc";
import { AddOptionsWord, WordBlockChildren, WordInlineChildren } from "./options/WordTypes";
import { createContent } from "@ext/wordExport/TextWordGenerator";
import { createParagraph } from "@ext/wordExport/createParagraph";
import { NON_BREAKING_SPACE } from "@ext/wordExport/options/wordExportSettings";
import { ExportType } from "@ext/wordExport/ExportType";

export class WordSerializerState {
	constructor(
		private _inlineConfig: WordInlineChildren,
		private _blockConfig: WordBlockChildren,
		private readonly _domain: string,
		private _parserContext: ParserContext,
		private _exportType: ExportType,
	) {}

	async renderInline(parent: Tag, addOptions?: AddOptionsWord): Promise<ParagraphChild[]> {
		const paragraphChild = await Promise.all(
			parent.children.map(async (child) => {
				if (!child) return;

				if (typeof child === "string") {
					let text = addOptions?.removeWhiteSpace ? child.trim() : child;

					if (addOptions?.code) text = NON_BREAKING_SPACE + text + NON_BREAKING_SPACE;
					return createContent(text, addOptions);
				}

				return this._inlineConfig[child.name]?.({
					state: this,
					tag: child,
					addOptions,
					wordRenderContext: {
						parserContext: this._parserContext,
						exportType: this._exportType,
						domain: this._domain,
					},
				});
			}),
		);

		return paragraphChild.flat().filter((val) => val);
	}

	async renderBlockAsInline(tag: Tag) {
		return (
			await Promise.all(
				tag.children.map(async (child, i) => {
					if (!child) return;
					if (typeof child === "string") return new TextRun(child);

					return [
						(await this.renderInline(child)).flat().filter((val) => val),
						...(tag.children.length > 1 && tag.children.length > i + 1 ? [new TextRun({ break: 1 })] : []),
					];
				}),
			)
		)
			.filter((val) => val)
			.flat(2);
	}

	async renderBlock(block: Tag, addOptions?: AddOptionsWord): Promise<FileChild[]> {
		if (!this._blockConfig[block.name] && this._inlineConfig[block.name])
			return [createParagraph(await this.renderInline({ children: [block] } as Tag))];

		return this._blockConfig[block.name]?.({
			state: this,
			tag: block,
			addOptions,
			wordRenderContext: {
				parserContext: this._parserContext,
				exportType: this._exportType,
				domain: this._domain,
			},
		});
	}
}
