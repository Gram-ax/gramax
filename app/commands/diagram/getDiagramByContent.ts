import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import HashItem from "@core/Hash/HashItems/HashItem";
import HashItemContent from "@core/Hash/HashItems/HashItemContent";
import DiagramType from "@core/components/Diagram/DiagramType";
import Diagrams from "@core/components/Diagram/Diagrams";
import PlantUmlEncoder from "plantuml-encoder";
import { Command, ResponseKind } from "../../types/Command";

const getDiagramByContent: Command<
	{ type: DiagramType; encodeContent: string; count?: number },
	{ hashItem: HashItem; mime: MimeTypes }
> = Command.create({
	path: "diagram/content",

	kind: ResponseKind.blob,

	middlewares: [new MainMiddleware()],

	do({ type, encodeContent, count }) {
		const { conf } = this._app;

		const content = PlantUmlEncoder.decode(encodeContent);
		const diagrams = new Diagrams(conf.enterpriseServerUrl);

		const hashItem: HashItem = new HashItemContent(
			encodeContent,
			async () => await diagrams.getDiagram(type, content, +count),
			() => content,
		);
		return {
			mime: diagrams.getDiagramMime(type),
			hashItem: hashItem,
		};
	},

	params(ctx, query) {
		return {
			encodeContent: query.content,
			type: query.diagram as DiagramType,
			count: Number.parseInt(query.count),
		};
	},
});

export default getDiagramByContent;
