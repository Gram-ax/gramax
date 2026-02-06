import docx from "@dynamicImports/docx";
import type UiLanguage from "@ext/localization/core/model/Language";
import { BaseImageProcessor } from "@ext/markdown/elements/image/export/BaseImageProcessor";
import { ImageDimensionsFinder } from "@ext/markdown/elements/image/word/ImageDimensionsFinder";
import { errorWordLayout } from "@ext/wordExport/error";
import type { AddOptionsWord, ImageDimensions } from "@ext/wordExport/options/WordTypes";
import { diagramString, WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import type { JSONContent } from "@tiptap/core";
import Diagrams from "../../../../../logic/components/Diagram/Diagrams";
import type DiagramType from "../../../../../logic/components/Diagram/DiagramType";
import Path from "../../../../../logic/FileProvider/Path/Path";
import type ResourceManager from "../../../../../logic/Resource/ResourceManager";
import type { Tag } from "../../../core/render/logic/Markdoc";

export class WordDiagramRenderer {
	static async renderSimpleDiagram(
		tag: Tag | JSONContent,
		addOptions: AddOptionsWord,
		diagramType: DiagramType,
		resourceManager: ResourceManager,
		language: UiLanguage,
		diagramRendererServerUrl?: string,
	) {
		const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
		if (attrs.src && attrs.content) return;

		try {
			const { Paragraph, TextRun } = await docx();
			const diagramContent = await WordDiagramRenderer.getDiagramContent(tag, resourceManager);
			const diagram = await new Diagrams(diagramRendererServerUrl).getDiagram(diagramType, diagramContent);
			const size = ImageDimensionsFinder.getSvgDimensions(diagram, addOptions?.maxPictureWidth);
			const paragraphs = [
				await WordDiagramRenderer._getParagraphWithImage(
					await BaseImageProcessor.svgToPng(diagram, size),
					size,
				),
			];

			if (attrs.title)
				paragraphs.push(
					new Paragraph({
						children: [new TextRun({ text: attrs.title })],
						style: WordFontStyles.pictureTitle,
					}),
				);

			return paragraphs;
		} catch (error) {
			return errorWordLayout(diagramString(language), language);
		}
	}

	static async getDiagramContent(tag: Tag | JSONContent, resourceManager: ResourceManager) {
		const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
		return (attrs.content as string) ?? (await resourceManager.getContent(new Path(attrs.src))).toString();
	}

	private static async _getParagraphWithImage(
		diagramImage: string | Buffer | Uint8Array | ArrayBuffer,
		size: ImageDimensions,
	) {
		const { Paragraph } = await docx();
		return new Paragraph({
			children: [await WordDiagramRenderer._getImageRun(diagramImage, size)],
			style: WordFontStyles.picture,
		});
	}

	private static async _getImageRun(diagramImage: string | Buffer | Uint8Array | ArrayBuffer, size: ImageDimensions) {
		const { ImageRun } = await docx();
		return new ImageRun({
			data: diagramImage,
			transformation: {
				height: size.height,
				width: size.width,
			},
		});
	}
}
