/** biome-ignore-all lint/complexity/noStaticOnlyClass: expected */
import Diagrams from "@core/components/Diagram/Diagrams";
import type DiagramType from "@core/components/Diagram/DiagramType";
import Path from "@core/FileProvider/Path/Path";
import type ResourceManager from "@core/Resource/ResourceManager";
import { PDFImageExporter } from "@ext/markdown/elements/image/pdf/PdfImageProcessor";
import type { JSONContent } from "@tiptap/core";

export class pdfDiagramRenderer {
	static async renderSimpleDiagram(
		node: JSONContent,
		diagramType: DiagramType,
		resourceManager: ResourceManager,
		maxWidth?: number,
		diagramRendererServerUrl?: string,
	) {
		if (node.attrs.src && node.attrs.content) return;

		try {
			const diagramContent = await this.getDiagramContent(node, resourceManager);
			const diagram = await new Diagrams(diagramRendererServerUrl).getDiagram(diagramType, diagramContent);
			return await PDFImageExporter.getImageFromSvgString(diagram, maxWidth);
		} catch {}
	}

	static async getDiagramContent(node: JSONContent, resourceManager: ResourceManager) {
		return (
			(node.attrs.content as string) ?? (await resourceManager.getContent(new Path(node.attrs.src))).toString()
		);
	}
}
