import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import getMermaidDiagram from "@ext/markdown/elements/diagrams/diagrams/mermaid/getMermaidDiagram";
import getPlantUmlDiagram from "@ext/markdown/elements/diagrams/diagrams/plantUml/getPlantUmlDiagram";
import DefaultError from "../../../extensions/errorHandlers/logic/DefaultError";
import DiagramType from "./DiagramType";

export default class Diagrams {
	private readonly _diagramMetadata: Partial<
		Record<DiagramType, { mimeType: MimeTypes; toType: string; req: string }>
	> = {
		"C4-diagram": { mimeType: MimeTypes.svg, toType: "json", req: "dsl" },
		"Ts-diagram": { mimeType: MimeTypes.svg, toType: "svg", req: "typeScript" },
	};

	constructor(private _enterpriseServerUrl: string) {}

	getDiagram(type: DiagramType, content: string, count?: number): Promise<string> {
		switch (type) {
			case DiagramType["plant-uml"]:
				return getPlantUmlDiagram(content);
			case DiagramType.mermaid:
				return getMermaidDiagram(content);
			case DiagramType["c4-diagram"]:
				return count ? this._getC4Diagram(count, content) : this._getSimpleDiagram(type, content);
			default:
				return this._getSimpleDiagram(type, content);
		}
	}

	getDiagramMime(type: DiagramType) {
		return this._diagramMetadata[type].mimeType;
	}

	private async _getC4Diagram(count: number, content: string) {
		const type = DiagramType["c4-diagram"];
		const diagram = (await this._getDiagramInternal(type, content)) as any;
		return JSON.parse(diagram.content).viz[count].svg;
	}

	private async _getSimpleDiagram(type: DiagramType, content: string) {
		if (!this._diagramMetadata[type]) throw new DefaultError(`Неправильное имя диаграммы: ${type}`);
		return await this._getDiagramInternal(type, content);
	}

	private async _getDiagramInternal(type: DiagramType, content: string) {
		const metadata = this._diagramMetadata[type];
		const url = `${this._enterpriseServerUrl}/diagram-renderer/convert/${metadata.req}/${metadata.toType}`;
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "text/plain" },
			body: content,
		});
		if (response.status !== 200) {
			console.log(`Не удалось отрисовать диаграмму: ${url} (статус ${response.status})`);
			throw new DefaultError("Мы не смогли отрисовать вашу диаграмму.");
		}
		return await (await response.blob()).text();
	}
}
