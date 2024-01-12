import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import DiagramType from "@core/components/Diagram/DiagramType";
import DiagramRender from "@ext/markdown/elements/diagrams/component/DiagramRender";
import getPlantUmlDiagram from "@ext/markdown/elements/diagrams/diagrams/plantUml/getPlantUmlDiagram";
import { useEffect, useState } from "react";

const PlantUMLRenderer = ({
	diagramContent,
	src,
	isUpdating = false,
}: {
	diagramContent?: string;
	src: string;
	isUpdating?: boolean;
}) => {
	const [state, setState] = useState<{ error?: any; diagramData?: string }>({});
	const apiUrlCreator = ApiUrlCreatorService.value;

	const loadData = async () => {
		try {
			setState({ diagramData: await getPlantUmlDiagram(diagramContent, apiUrlCreator, src) });
		} catch (error) {
			setState({ error });
		}
	};

	useEffect(() => {
		setState({});
		loadData();
	}, [diagramContent, src, isUpdating]);

	return <DiagramRender diagramName={DiagramType["plant-uml"]} data={state.diagramData} error={state.error} />;
};

export default PlantUMLRenderer;
