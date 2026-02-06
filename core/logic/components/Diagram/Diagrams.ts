import getMermaidDiagram from "@ext/markdown/elements/diagrams/diagrams/mermaid/getMermaidDiagram";
import getPlantUmlDiagram from "@ext/markdown/elements/diagrams/diagrams/plantUml/getPlantUmlDiagram";
import DiagramType from "./DiagramType";

export default class Diagrams {
	constructor(private _diagramRendererServerUrl: string) {}

	getDiagram(type: DiagramType, content: string): Promise<string> {
		switch (type) {
			case DiagramType["plant-uml"]:
				return getPlantUmlDiagram(content, this._diagramRendererServerUrl);
			case DiagramType.mermaid:
				return getMermaidDiagram(content);
		}
	}
}
