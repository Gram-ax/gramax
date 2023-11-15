import { IRunOptions, LineRuleType, Paragraph, ParagraphChild, TextRun } from "docx";
import { FileChild } from "docx/build/file/file-child";
import FileProvider from "../../logic/FileProvider/model/FileProvider";
import ResourceManager from "../../logic/Resource/ResourceManager";
import ParserContext from "../markdown/core/Parser/ParserContext/ParserContext";
import { Tag } from "../markdown/core/render/logic/Markdoc";
import { AddOptionsWord, WordBlockChilds, WordInlineChilds } from "./WordTypes";
import { wordFontSizes } from "./wordExportSizes";

const convertMmToOneAndHalfLineSpacing = 18; // Aka 1.5 line

export class WordSerializerState {
	constructor(
		private _inlineConfig: WordInlineChilds,
		private _blockConfig: WordBlockChilds,
		private _resourceManager: ResourceManager,
		private _fileProvider: FileProvider,
		private _parserContext: ParserContext,
	) {}

	async renderInline(parent: Tag, addOptions?: AddOptionsWord): Promise<ParagraphChild[]> {
		const paragraphChild = await Promise.all(
			parent.children.map(async (child) => {
				if (!child) return;
				if (typeof child === "string")
					return new TextRun({
						text: addOptions?.removeWhiteSpace ? child.trim() : child,
						size: wordFontSizes.normal,
						...(addOptions as IRunOptions),
					});

				return await this._inlineConfig[child.name]?.({
					state: this,
					tag: child,
					addOptions: addOptions,
					resourceManager: this._resourceManager,
					fileProvider: this._fileProvider,
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
						...(tag.children.length > 1 && tag.children.length > i + 1
							? [new TextRun({ text: "", break: 1 })]
							: []),
					];
				}),
			)
		)
			.filter((val) => val)
			.flat(2);
	}

	async renderBlock(block: Tag, addOptions?: AddOptionsWord): Promise<FileChild[]> {
		if (!this._blockConfig[block.name] && this._inlineConfig[block.name])
			return [new Paragraph({ children: await this.renderInline({ children: [block] } as Tag) })];

		return await this._blockConfig[block.name]?.({
			state: this,
			tag: block,
			addOptions: {
				...addOptions,
				spacing: {
					line: wordFontSizes.normal * convertMmToOneAndHalfLineSpacing,
					lineRule: LineRuleType.AT_LEAST,
				},
			},
			resourceManager: this._resourceManager,
			fileProvider: this._fileProvider,
			parserContext: this._parserContext,
		});
	}
}
