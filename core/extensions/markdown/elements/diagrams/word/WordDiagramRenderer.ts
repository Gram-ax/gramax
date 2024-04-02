import { AlignmentType, ImageRun, Paragraph } from "docx";
import Path from "../../../../../logic/FileProvider/Path/Path";
import ResourceManager from "../../../../../logic/Resource/ResourceManager";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";
import Diagrams from "../../../../../logic/components/Diagram/Diagrams";
import { ImageDimensions, WordExportHelper } from "../../../../wordExport/WordExportHelpers";
import { Tag } from "../../../core/render/logic/Markdoc";
import C4Data from "../diagrams/c4Diagram/C4Data";

export class WordDiagramRenderer {
	static async renderSimpleDiagram(
		tag: Tag,
		diagramType: DiagramType,
		resourceManager: ResourceManager,
		diagramRendererServerUrl?: string,
	) {
		if (tag.attributes.src && tag.attributes.content) return;

		const diagramContent =
			tag.attributes.content ?? (await resourceManager.getContent(new Path(tag.attributes.src))).toString();

		try {
			const diagram = await new Diagrams(diagramRendererServerUrl).getDiagram(diagramType, diagramContent);
			const diagramImage = await WordExportHelper.getImageFromDom(diagram);

			const dimensions = await WordExportHelper.getImageSizeFromImageData(diagramImage);

			return [WordDiagramRenderer.getParagraphWithImage(await diagramImage.arrayBuffer(), dimensions)];
		} catch (error) {
			return;
		}
	}

	static async renderC4Diagram(
		tag: Tag,
		diagramType: DiagramType,
		resourceManager: ResourceManager,
		diagramRendererServerUrl: string,
	) {
		if (tag.attributes.src && tag.attributes.content) return;

		const diagramContent =
			tag.attributes.content ?? (await resourceManager.getContent(new Path(tag.attributes.src))).toString();

		try {
			const diagramString = await new Diagrams(diagramRendererServerUrl).getDiagram(diagramType, diagramContent, NaN);
			const diagramJson: C4Data = JSON.parse(diagramString);

			const images = [];
			for (let i = 0; i < diagramJson.viz.length; i++) {
				const viz = diagramJson.viz[i];
				const diagramImage = await WordExportHelper.getImageFromDom(viz.svg);
				const dimensions = await WordExportHelper.getImageSizeFromImageData(diagramImage);
				images.push(WordDiagramRenderer.getParagraphWithImage(await diagramImage.arrayBuffer(), dimensions));
			}

			return images;
		} catch (error) {
			return;
		}
	}

	private static getParagraphWithImage(
		diagramImage: string | Buffer | Uint8Array | ArrayBuffer,
		dimensions: ImageDimensions,
	) {
		return new Paragraph({
			children: [
				new ImageRun({
					data: diagramImage,
					transformation: {
						height: dimensions.height,
						width: dimensions.width,
					},
				}),
			],
			alignment: AlignmentType.CENTER,
		});
	}
}
