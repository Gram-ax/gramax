import UiLanguage from "@ext/localization/core/model/Language";
import { errorWordLayout } from "@ext/wordExport/error";
import { ImageRun, Paragraph, TextRun } from "docx";
import Path from "../../../../../logic/FileProvider/Path/Path";
import ResourceManager from "../../../../../logic/Resource/ResourceManager";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";
import Diagrams from "../../../../../logic/components/Diagram/Diagrams";
import { Tag } from "../../../core/render/logic/Markdoc";
import C4Data from "../diagrams/c4Diagram/C4Data";
import { WordFontStyles, diagramString } from "@ext/wordExport/options/wordExportSettings";
import { AddOptionsWord, ImageDimensions } from "@ext/wordExport/options/WordTypes";
import { ImageDimensionsFinder } from "@ext/markdown/elements/image/word/ImageDimensionsFinder";
import { BaseImageProcessor } from "@ext/markdown/elements/image/export/BaseImageProcessor";
import { JSONContent } from "@tiptap/core";

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
			const diagramContent = await this.getDiagramContent(tag, resourceManager);
			const diagram = await new Diagrams(diagramRendererServerUrl).getDiagram(diagramType, diagramContent);
			const size = ImageDimensionsFinder.getSvgDimensions(diagram, addOptions?.maxPictureWidth);
			const paragraphs = [
				WordDiagramRenderer._getParagraphWithImage(await BaseImageProcessor.svgToPng(diagram, size), size),
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
		return (
			(attrs.content as string) ??
			(await resourceManager.getContent(new Path(attrs.src))).toString()
		);
	}

	static async renderC4Diagram(
		tag: Tag | JSONContent,
		addOptions: AddOptionsWord,
		diagramType: DiagramType,
		resourceManager: ResourceManager,
		language: UiLanguage,
		diagramRendererServerUrl: string,
	) {
		const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
		if (attrs.src && attrs.content) return;

		const diagramContent = attrs.content ?? (await resourceManager.getContent(new Path(attrs.src))).toString();

		try {
			const diagramString = await new Diagrams(diagramRendererServerUrl).getDiagram(diagramType, diagramContent);
			const diagramJson: C4Data = JSON.parse(diagramString);

			const images = await Promise.all(
				diagramJson.viz.map(async (viz) => {
					const size = ImageDimensionsFinder.getSvgDimensions(viz.svg, addOptions?.maxPictureWidth);
					return WordDiagramRenderer._getParagraphWithImage(
						await BaseImageProcessor.svgToPng(viz.svg, size),
						size,
					);
				}),
			);

			return images;
		} catch (error) {
			return errorWordLayout(diagramString(language), language);
		}
	}

	private static _getParagraphWithImage(
		diagramImage: string | Buffer | Uint8Array | ArrayBuffer,
		size: ImageDimensions,
	) {
		return new Paragraph({
			children: [this._getImageRun(diagramImage, size)],
			style: WordFontStyles.picture,
		});
	}

	private static _getImageRun(diagramImage: string | Buffer | Uint8Array | ArrayBuffer, size: ImageDimensions) {
		return new ImageRun({
			data: diagramImage,
			transformation: {
				height: size.height,
				width: size.width,
			},
		});
	}
}
