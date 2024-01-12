import MermaidRenderer from "@ext/markdown/elements/diagrams/component/MermaidRenderer";
import PlantUMLRenderer from "@ext/markdown/elements/diagrams/component/PlantUMLRenderer";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";

const diagramComponents: Partial<
	Record<DiagramType, (content: string, src: string, isUpdating?: boolean) => JSX.Element>
> = {
	"Plant-uml": (content: string, src: string, isUpdating?: boolean) => (
		<PlantUMLRenderer diagramContent={content} src={src} isUpdating={isUpdating} />
	),
	Mermaid: (content: string, src: string, isUpdating?: boolean) => (
		<MermaidRenderer diagramContent={content} src={src} isUpdating={isUpdating} />
	),
};

export default diagramComponents;
