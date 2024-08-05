import { ResponseKind } from "@app/types/ResponseKind";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import HashItem from "@core/Hash/HashItems/HashItem";
import HashItemContent from "@core/Hash/HashItems/HashItemContent";
import DiagramType from "@core/components/Diagram/DiagramType";
import Diagrams from "@core/components/Diagram/Diagrams";
import { Command } from "../../../types/Command";

const getDiagramByContent: Command<
	{ type: DiagramType; count?: number; content: string },
	{ hashItem: HashItem; mime: MimeTypes }
> = Command.create({
	path: "diagram/content",

	kind: ResponseKind.blob,

	do({ type, content, count }) {
		const diagrams = new Diagrams(this._app.wm.current().config().services?.diagramRenderer?.url);

		const hashItem: HashItem = new HashItemContent(
			content,
			async () => await diagrams.getDiagram(type, content, count),
			() => content,
		);
		return {
			mime: diagrams.getDiagramMime(type),
			hashItem: hashItem,
		};
	},

	params(_, query, body) {
		return {
			content: body,
			type: query.diagram as DiagramType,
			count: Number.parseInt(query.count),
		};
	},
});

export default getDiagramByContent;
