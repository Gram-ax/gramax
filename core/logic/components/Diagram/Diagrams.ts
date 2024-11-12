import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import haveInternetAccess from "@core/utils/haveInternetAccess";
import NetworkError from "@ext/errorHandlers/network/NetworkError";
import SilentError from "@ext/errorHandlers/silent/SilentError";
import t from "@ext/localization/locale/translate";
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

	constructor(private _diagramRendererServerUrl: string) {}

	getDiagram(type: DiagramType, content: string, count?: number): Promise<string> {
		switch (type) {
			case DiagramType["plant-uml"]:
				return getPlantUmlDiagram(content, this._diagramRendererServerUrl);
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
		if (!this._diagramMetadata[type]) throw new DefaultError(`${t("diagram.error.wrong-name")}: ${type}`);
		return await this._getDiagramInternal(type, content);
	}

	private async _getDiagramInternal(type: DiagramType, content: string) {
		const metadata = this._diagramMetadata[type];
		if (!haveInternetAccess()) throw new NetworkError({ errorCode: "silent" });
		const url = `${this._diagramRendererServerUrl}/convert/${metadata.req}/${metadata.toType}`;

		if (!content) throw new SilentError(t("diagram.error.cannot-get-data"));

		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "text/plain" },
			body: content,
		}).catch(() => {
			throw new SilentError(t("diagram.error.no-internet"));
		});
		if (response.status !== 200) {
			console.log(`${t("diagram.error.render-failed")}: ${url} (${response.status})`);
			throw new SilentError(t("app.error.something-went-wrong"));
		}
		return await (await response.blob()).text();
	}
}
