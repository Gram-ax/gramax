import Language from "@ext/localization/core/model/Language";
import { errorWordLayout } from "@ext/wordExport/error";
import { WordFontStyles, diagramString } from "@ext/wordExport/options/wordExportSettings";
import { ImageRun, Paragraph, TextRun } from "docx";
import Path from "../../../../../logic/FileProvider/Path/Path";
import ResourceManager from "../../../../../logic/Resource/ResourceManager";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";
import Diagrams from "../../../../../logic/components/Diagram/Diagrams";
import { ImageDimensions, WordExportHelper } from "../../../../wordExport/WordExportHelpers";
import { Tag } from "../../../core/render/logic/Markdoc";
import C4Data from "../diagrams/c4Diagram/C4Data";
import { AddOptionsWord } from "@ext/wordExport/options/WordTypes";

export class WordDiagramRenderer {
	static async renderSimpleDiagram(
		tag: Tag,
		addOptions: AddOptionsWord,
		diagramType: DiagramType,
		resourceManager: ResourceManager,
		language: Language,
		diagramRendererServerUrl?: string,
	) {
		if (tag.attributes.src && tag.attributes.content) return;

		try {
			const diagramContent =
				tag.attributes.content ?? (await resourceManager.getContent(new Path(tag.attributes.src))).toString();
			const diagram = await new Diagrams(diagramRendererServerUrl).getDiagram(diagramType, diagramContent);
			const size = WordExportHelper.getSvgDimensions(diagram, addOptions?.maxPictureWidth);
			const diagramImage = await WordExportHelper.svgToPngBlob(diagram, size);
			const dimensions = await WordExportHelper.getImageSizeFromImageData(diagramImage, size.width, size.height);

			const paragraphs = [
				WordDiagramRenderer._getParagraphWithImage(await diagramImage.arrayBuffer(), dimensions),
			];

			if (tag.attributes.title)
				paragraphs.push(
					new Paragraph({
						children: [new TextRun({ text: tag.attributes.title })],
						style: WordFontStyles.pictureTitle,
					}),
				);

			return paragraphs;
		} catch (error) {
			return errorWordLayout(diagramString(language), language);
		}
	}

	static async renderC4Diagram(
		tag: Tag,
		addOptions: AddOptionsWord,
		diagramType: DiagramType,
		resourceManager: ResourceManager,
		language: Language,
		diagramRendererServerUrl: string,
	) {
		if (tag.attributes.src && tag.attributes.content) return;

		const diagramContent =
			tag.attributes.content ?? (await resourceManager.getContent(new Path(tag.attributes.src))).toString();

		try {
			const diagramString = await new Diagrams(diagramRendererServerUrl).getDiagram(diagramType, diagramContent);
			const diagramJson: C4Data = JSON.parse(diagramString);

			const images = await Promise.all(
				diagramJson.viz.map(async (viz) => {
					const size = WordExportHelper.getSvgDimensions(viz.svg, addOptions?.maxPictureWidth);
					const diagramImage = await WordExportHelper.svgToPngBlob(viz.svg, size);
					const dimensions = await WordExportHelper.getImageSizeFromImageData(diagramImage);
					return WordDiagramRenderer._getParagraphWithImage(await diagramImage.arrayBuffer(), dimensions);
				}),
			);

			return images;
		} catch (error) {
			return errorWordLayout(diagramString(language), language);
		}
	}

	private static _getParagraphWithImage(
		diagramImage: string | Buffer | Uint8Array | ArrayBuffer,
		dimensions: ImageDimensions,
	) {
		return new Paragraph({
			children: [this._getImageRun(diagramImage, dimensions)],
			style: WordFontStyles.picture,
		});
	}

	private static _getImageRun(diagramImage: string | Buffer | Uint8Array | ArrayBuffer, dimensions: ImageDimensions) {
		return new ImageRun({
			data: diagramImage,
			transformation: {
				height: dimensions.height,
				width: dimensions.width,
			},
		});
	}
}
