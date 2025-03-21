import Diagrams from "@core/components/Diagram/Diagrams";
import DiagramType from "@core/components/Diagram/DiagramType";
import Path from "@core/FileProvider/Path/Path";
import ResourceManager from "@core/Resource/ResourceManager";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { PDFImageExporter } from "@ext/markdown/elements/image/pdf/PdfImageProcessor";

export class pdfDiagramRenderer {
	static async renderSimpleDiagram(
		tag: Tag,
		diagramType: DiagramType,
		resourceManager: ResourceManager,
		maxWidth?: number,
		diagramRendererServerUrl?: string,
	) {
		if (tag.attributes.src && tag.attributes.content) return;

		try {
			const diagramContent = await this.getDiagramContent(tag, resourceManager);
			const diagram = await new Diagrams(diagramRendererServerUrl).getDiagram(diagramType, diagramContent);
			return await PDFImageExporter.getImageFromSvgString(diagram, maxWidth);
		} catch (error) {}
	}

	static async getDiagramContent(tag: Tag, resourceManager: ResourceManager) {
		return (
			(tag.attributes.content as string) ??
			(await resourceManager.getContent(new Path(tag.attributes.src))).toString()
		);
	}
}
