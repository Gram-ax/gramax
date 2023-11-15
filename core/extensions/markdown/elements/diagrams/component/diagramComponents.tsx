import { lazy } from "react";
import DiagramType from "../../../../../logic/components/Diagram/DiagramType";

const PlantUMLRenderer = lazy(() => import("./PlantUMLRenderer"));
const MermaidRenderer = lazy(() => import("./MermaidRenderer"));

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
