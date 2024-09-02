import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import getMermaidDiagram from "@ext/markdown/elements/diagrams/diagrams/mermaid/getMermaidDiagram";
import getPlantUmlDiagram from "@ext/markdown/elements/diagrams/diagrams/plantUml/getPlantUmlDiagram";
import { useRef, useState } from "react";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";
import C4Render from "./C4Render";
import DiagramRender from "./DiagramRender";

const DIAGRAM_FUNCTIONS = {
	[DiagramType.mermaid]: getMermaidDiagram,
	[DiagramType["plant-uml"]]: getPlantUmlDiagram,
};

export default function DiagramData(props: {
	diagramName: DiagramType;
	openEditor?: () => void;
	src?: string;
	title?: string;
	content?: string;
}) {
	const { src, title, content, diagramName, openEditor } = props;
	const isC4Diagram = diagramName == DiagramType["c4-diagram"];
	const apiUrlCreator = ApiUrlCreatorService.value;

	const ref = useRef<HTMLDivElement | HTMLImageElement>();
	const [data, setData] = useState(null);
	const [error, setError] = useState(null);

	const getAnyDiagrams = async (content: string) => {
		const res = await FetchService.fetch(apiUrlCreator.getDiagramByContentUrl(diagramName), content);
		if (!res.ok) return setError(await res.json());
		return isC4Diagram ? await res.json() : await res.text();
	};

	OnLoadResourceService.useGetContent(
		src,
		apiUrlCreator,
		async (buffer: Buffer) => {
			try {
				setError(null);
				const diagramData = DIAGRAM_FUNCTIONS?.[diagramName]
					? await DIAGRAM_FUNCTIONS?.[diagramName](buffer.toString())
					: await getAnyDiagrams(buffer.toString());
				setData(diagramData);
			} catch (err) {
				setError(err);
			}
		},
		content,
	);

	return (
		<>
			{isC4Diagram ? (
				<C4Render data={data} error={error} />
			) : (
				<DiagramRender
					openEditor={openEditor}
					ref={ref}
					downloadSrc={src}
					title={title}
					diagramName={diagramName}
					data={data}
					error={error}
				/>
			)}
			{title && !error && <em>{title}</em>}
		</>
	);
}
