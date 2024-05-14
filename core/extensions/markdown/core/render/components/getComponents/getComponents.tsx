import { ReactNode } from "react";
import DiagramType from "../../../../../../logic/components/Diagram/DiagramType";
import DiagramData from "../../../../elements/diagrams/component/DiagramData";
import HTMLComponents from "./HTMLComponents";

import LucideIcon from "../../../../elements/icon/render/components/Icon";
import Image from "@components/Atoms/Image/Image";
import Error from "@components/Error";
import Cmd from "../../../../elements/cmd/render/Cmd";
import Code from "../../../../elements/code/render/component/Code";
import Color from "../../../../elements/color/render/Color";
import Cut from "../../../../elements/cut/render/component/Cut";
import DbDiagram from "../../../../elements/diagramdb/render/DbDiagram";
import Drawio from "../../../../elements/drawio/render/component/Drawio";
import Fence from "../../../../elements/fence/render/component/Fence";
import Fn from "../../../../elements/fn/render/Fn";
import Formula from "../../../../elements/formula/render/Formula";
import Header from "../../../../elements/heading/render/component/Header";
import Images from "../../../../elements/imgs/render/Images";
import Include from "../../../../elements/include/render/Include";
import Issue from "../../../../elements/issue/render/Issue";
import Kbd from "../../../../elements/kbd/render/Kbd";
import Link from "../../../../elements/link/render/components/Link";
import Module from "../../../../elements/module/render/Module";
import Note from "../../../../elements/note/render/component/Note";
import OpenApi from "../../../../elements/openApi/render/OpenApi";
import See from "../../../../elements/see/render/See";
import Snippet from "../../../../elements/snippet/render/components/Snippet";
import Table from "../../../../elements/table/render/component/Table";
import DbTable from "../../../../elements/tabledb/render/DbTable";
import Tab from "../../../../elements/tabs/render/component/Tab";
import Tabs from "../../../../elements/tabs/render/component/Tabs";
import Term from "../../../../elements/term/render/Term";
import Video from "../../../../elements/video/render/components/Video";
import When from "../../../../elements/whowhen/render/When";
import Who from "../../../../elements/whowhen/render/Who";
import ParserContext from "../../../Parser/ParserContext/ParserContext";

export default function getComponents(): { [name: string]: (...props: any) => ReactNode } {
	return {
		Br: () => <br />,
		Color,
		Link,
		Formula,
		Fence,
		Snippet,
		Code,
		Alfa: () => <span className="alfa" />,
		Beta: () => <span className="beta" />,
		Sub: ({ children }: { children: JSX.Element }) => <sub>{children}</sub>,
		Cmd,
		Cut,
		Icon: LucideIcon,
		Issue,
		Module,
		Who,
		When,
		Kbd,
		Image,
		"Img-h": Images,
		"Img-v": Images,
		See,
		OpenApi,
		Fn,
		Note,
		Tabs,
		Tab,
		Video,
		Heading: Header,
		Drawio,
		Term,
		Error,
		Table,
		Include,
		"Db-table": DbTable,
		"Db-diagram": DbDiagram,
		Mermaid: getDiagramRender(DiagramType.mermaid),
		"Plant-uml": getDiagramRender(DiagramType["plant-uml"]),
		"C4-diagram": getDiagramRender(DiagramType["c4-diagram"]),
		"Ts-diagram": getDiagramRender(DiagramType["ts-diagram"]),
	};
}

export const getComponentsHTML = (requestURL?: string, context?: ParserContext) => {
	const components = getComponents();
	if (!context) return components;

	const htmlComponents: HTMLComponents = new HTMLComponents(requestURL, context);
	components.Code = htmlComponents.getCode();
	components.Image = htmlComponents.getImg();
	components.Video = htmlComponents.getNull();
	components.Drawio = htmlComponents.getNull();
	components.Mermaid = htmlComponents.getNull();
	components["Plant-uml"] = htmlComponents.getNull();
	components["C4-diagram"] = htmlComponents.getNull();
	components["Ts-diagram"] = htmlComponents.getNull();
	components["Db-diagram"] = htmlComponents.getNull();
	// components.Drawio = htmlComponents.getDrawio();
	// components["Db-diagram"] = htmlComponents.getDiagramdb();
	// components.Mermaid = htmlComponents.getDiagramRendererImage(DiagramType.mermaid);
	// components["Plant-uml"] = htmlComponents.getDiagramRendererImage(DiagramType["plant-uml"]);
	// components["C4-diagram"] = htmlComponents.getDiagramRendererImage(DiagramType["c4-diagram"]);
	// components["Ts-diagram"] = htmlComponents.getDiagramRendererImage(DiagramType["ts-diagram"]);
	return components;
};

function getDiagramRender(diagramName: DiagramType) {
	return (props) => <DiagramData diagramName={diagramName} {...props} />;
}
