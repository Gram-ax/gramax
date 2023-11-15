import DiagramType from "../../../../../logic/components/Diagram/DiagramType";
import getDiagramDataByLang from "./getDiagramDataByLang";

const isDiagramName = (lang: string): boolean => {
	const { name } = getDiagramDataByLang(lang);
	return name in DiagramType;
};

export default isDiagramName;
