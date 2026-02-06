import Error from "@components/Error";
import Alert from "@ext/markdown/elements/alert/render/component/Alert";
import { Answer } from "@ext/markdown/elements/answer/render/components/Answer";
import BlockField from "@ext/markdown/elements/blockContentField/render/components/BlockField";
import BlockProperty from "@ext/markdown/elements/blockProperty/render/components/BlockProperty";
import Fence from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import Color from "@ext/markdown/elements/color/render/components/Color";
import Highlight from "@ext/markdown/elements/highlight/render/components/Highlight";
import Html from "@ext/markdown/elements/html/render/components/HTML";
import HtmlTag from "@ext/markdown/elements/htmlTag/render/component/HtmlTag";
import InlineImage from "@ext/markdown/elements/inlineImage/render/components/InlineImage";
import InlineProperty from "@ext/markdown/elements/inlineProperty/render/components/InlineProperty";
import BulletList from "@ext/markdown/elements/list/render/BulletList";
import OrderList from "@ext/markdown/elements/list/render/OrderList";
import ReadonlyListItem from "@ext/markdown/elements/list/render/ReadonlyListItem";
import { Question } from "@ext/markdown/elements/question/render/components/Question";
import Unsupported from "@ext/markdown/elements/unsupported/render/component/Unsupported";
import View from "@ext/markdown/elements/view/render/components/View";
import { ReactNode } from "react";
import DiagramType from "../../../../../../logic/components/Diagram/DiagramType";
import Cmd from "../../../../elements/cmd/render/Cmd";
import Code from "../../../../elements/code/render/component/Code";
import Cut from "../../../../elements/cut/render/component/Cut";
import DbDiagram from "../../../../elements/diagramdb/render/DbDiagram";
import DiagramData from "../../../../elements/diagrams/component/DiagramData";
import Drawio from "../../../../elements/drawio/render/component/Drawio";
import Formula from "../../../../elements/formula/render/Formula";
import Header from "../../../../elements/heading/render/components/ArticleContentHeader";
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

export default function getComponents(): { [name: string]: (...props: any) => ReactNode } {
	return {
		Br: () => <br />,
		Link,
		Color,
		Formula,
		Fence,
		snippet: Snippet,
		Code,
		Alfa: () => <span className="alfa" />,
		Beta: () => <span className="beta" />,
		Sub: ({ children }: { children: JSX.Element }) => <sub>{children}</sub>,
		Cmd,
		Cut,
		icon: Icon,
		"inline-property": InlineProperty,
		"block-field": BlockField,
		"block-property": BlockProperty,
		questionAnswer: Answer,
		question: Question,
		inlineImage: InlineImage,
		Issue,
		Module,
		Who,
		When,
		Kbd,
		Html,
		inlineHtmlTag: HtmlTag,
		blockHtmlTag: HtmlTag,
		blockWithInlineHtmlTag: HtmlTag,
		selfClosingHtmlTag: HtmlTag,
		highlight: Highlight,
		View,
		Image,
		"Img-h": Images,
		"Img-v": Images,
		See,
		Li: ReadonlyListItem,
		listItem: ReadonlyListItem,
		taskItem: ReadonlyListItem,
		bulletList: BulletList,
		taskList: BulletList,
		orderedList: OrderList,
		OpenApi,
		note: Note,
		Alert,
		Unsupported,
		tabs: Tabs,
		tab: Tab,
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
	};
}

function getDiagramRender(diagramName: DiagramType) {
	return (props) => <DiagramData diagramName={diagramName} {...props} />;
}
