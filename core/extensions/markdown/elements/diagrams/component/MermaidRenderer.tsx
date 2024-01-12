import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import DiagramRender from "@ext/markdown/elements/diagrams/component/DiagramRender";
import getMermaidDiagram from "@ext/markdown/elements/diagrams/diagrams/mermaid/getMermaidDiagram";
import { useEffect, useState } from "react";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";

const mermaid = import("mermaid")

const MermaidRenderer = ({
	diagramContent,
	src,
	isUpdating = false,
}: {
	diagramContent?: string;
	src?: string;
	isUpdating?: boolean;
}) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [state, setState] = useState<{ error?: any; diagramData?: string }>({});

	const loadData = async (diagramContent?: string, src?: string) => {
		try {
			setState({ diagramData: await getMermaidDiagram(diagramContent, apiUrlCreator, src) });
		} catch (error) {
			setState({ error });
		}
	};

	useEffect(() => {
		setState({});
		mermaid.then((mermaid) => mermaid.default.initialize({ startOnLoad: true, securityLevel: "strict" }));
		loadData(diagramContent, src);
	}, [diagramContent, src, isUpdating]);

	return <DiagramRender diagramName={DiagramType.mermaid} data={state.diagramData} error={state.error} />;
};

export default MermaidRenderer;
