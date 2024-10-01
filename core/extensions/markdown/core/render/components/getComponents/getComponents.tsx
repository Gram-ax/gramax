import { ReactNode } from "react";
import DiagramType from "../../../../../../logic/components/Diagram/DiagramType";
import DiagramData from "../../../../elements/diagrams/component/DiagramData";
import HTMLComponents, { unSupportedElements } from "./HTMLComponents";

import Error from "@components/Error";
import Alert from "@ext/markdown/elements/alert/render/component/Alert";
import Fence from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import Html from "@ext/markdown/elements/html/render/components/HTML";
import Unsupported from "@ext/markdown/elements/unsupported/render/component/Unsupported";
import Cmd from "../../../../elements/cmd/render/Cmd";
import Code from "../../../../elements/code/render/component/Code";
import Color from "../../../../elements/color/render/Color";
import Cut from "../../../../elements/cut/render/component/Cut";
import DbDiagram from "../../../../elements/diagramdb/render/DbDiagram";
import Drawio from "../../../../elements/drawio/render/component/Drawio";
import Fn from "../../../../elements/fn/render/Fn";
import Formula from "../../../../elements/formula/render/Formula";
import Header from "../../../../elements/heading/render/component/Header";
import Icon from "../../../../elements/icon/render/components/Icon";
import Image from "../../../../elements/image/render/components/Image";
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
		Icon,
		Issue,
		Module,
		Who,
		When,
		Kbd,
		Html,
		Image,
		"Img-h": Images,
		"Img-v": Images,
		See,
		OpenApi,
		Fn,
		Note,
		Alert,
		Unsupported,
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
	components.Link = htmlComponents.getLink();
	components.Code = htmlComponents.getCode();
	components.Image = htmlComponents.getImg();
	components.Drawio = htmlComponents.getDrawio();
	components.Tab = htmlComponents.getNullComponent(unSupportedElements.tab);
	components.Tabs = htmlComponents.getTabs();
	components.Mermaid = htmlComponents.getNullComponent(unSupportedElements.mermaid);
	components.OpenApi = htmlComponents.getNullComponent(unSupportedElements.openApi);
	components["Plant-uml"] = htmlComponents.getPlantUmlDiagram();
	components["C4-diagram"] = htmlComponents.getNullComponent(unSupportedElements["c4-diagram"]);
	components["Ts-diagram"] = htmlComponents.getNullComponent(unSupportedElements["ts-diagram"]);
	components["Db-diagram"] = htmlComponents.getNullComponent(unSupportedElements["db-diagram"]);
	// components["Db-diagram"] = htmlComponents.getDiagramdb();
	// components.Mermaid = htmlComponents.getDiagramRendererImage(DiagramType.mermaid);
	// components["C4-diagram"] = htmlComponents.getDiagramRendererImage(DiagramType["c4-diagram"]);
	// components["Ts-diagram"] = htmlComponents.getDiagramRendererImage(DiagramType["ts-diagram"]);
	return components;
};

function getDiagramRender(diagramName: DiagramType) {
	return (props) => <DiagramData diagramName={diagramName} {...props} />;
}
