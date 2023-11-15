import DiagramType from "../../../../../logic/components/Diagram/DiagramType";
import { Tag } from "../../../core/render/logic/Markdoc";
import getDiagramDataByLang from "./getDiagramDataByLang";

const getDiagramTagByFence = (lang: string, content: string) => {
	const { name, title } = getDiagramDataByLang(lang);
	return new Tag(DiagramType[name], { content, title });
};

export default getDiagramTagByFence;
