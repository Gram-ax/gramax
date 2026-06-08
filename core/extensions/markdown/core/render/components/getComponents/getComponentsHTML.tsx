import type DiagramType from "@core/components/Diagram/DiagramType";
import HTMLAlert from "@ext/markdown/elements/alert/render/component/HTMLAlert";
import HTMLAlfa from "@ext/markdown/elements/alfaBeta/render/components/HTMLAlfa";
import HTMLBeta from "@ext/markdown/elements/alfaBeta/render/components/HTMLBeta";
import HTMLBlockField from "@ext/markdown/elements/blockContentField/render/components/HTMLBlockField";
import HTMLBlockProperty from "@ext/markdown/elements/blockProperty/render/components/HTMLBlockProperty";
import HTMLBr from "@ext/markdown/elements/br/render/components/HTMLBr";
import HTMLCmd from "@ext/markdown/elements/cmd/render/HTMLCmd";
import HTMLCode from "@ext/markdown/elements/code/render/components/HTMLCode";
import HTMLColor from "@ext/markdown/elements/color/render/components/HTMLColor";
import HTMLCut from "@ext/markdown/elements/cut/render/components/HTMLCut";
import HTMLDrawio from "@ext/markdown/elements/drawio/render/components/HTMLDrawio";
import HTMLError from "@ext/markdown/elements/error/render/HTMLError";
import HTMLFence from "@ext/markdown/elements/fence/render/components/HTMLFence";
import HTMLFormula from "@ext/markdown/elements/formula/render/components/HTMLFormula";
import HTMLFragment from "@ext/markdown/elements/fragment/render/components/HTMLFragment";
import HTMLFragmentLink from "@ext/markdown/elements/fragment-link/render/components/HTMLFragmentLink";
import HTMLHeading from "@ext/markdown/elements/heading/render/components/HTMLHeading";
import HTMLHighlight from "@ext/markdown/elements/highlight/render/components/HTMLHighlight";
import HtmlBlock from "@ext/markdown/elements/html/render/components/HTML";
import HtmlTag from "@ext/markdown/elements/htmlTag/render/component/HtmlTag";
import { HTMLIcon } from "@ext/markdown/elements/icon/render/components/HTMLIcon";
import HTMLImage from "@ext/markdown/elements/image/render/components/HTMLImage";
import HTMLInclude from "@ext/markdown/elements/include/render/HTMLInclude";
import HTMLInlineProperty from "@ext/markdown/elements/inlineProperty/render/components/HTMLInlineProperty";
import HTMLIssue from "@ext/markdown/elements/issue/render/HTMLIssue";
import HTMLKbd from "@ext/markdown/elements/kbd/render/HTMLKbd";
import HTMLLink from "@ext/markdown/elements/link/render/components/HTMLLink";
import {
	HTMLBulletList,
	HTMLLi,
	HTMLListItem,
	HTMLOrderedList,
	HTMLTaskItem,
	HTMLTaskList,
} from "@ext/markdown/elements/list/render/HTMLLists";
import HTMLModule from "@ext/markdown/elements/module/render/HTMLModule";
import HTMLNote from "@ext/markdown/elements/note/render/components/HTMLNote";
import See from "@ext/markdown/elements/see/render/See";
import HTMLSub from "@ext/markdown/elements/sub/render/components/HTMLSub";
import HTMLTable from "@ext/markdown/elements/table/render/HtmlComponents/HTMLTable";
import HTMLTableCell from "@ext/markdown/elements/table/render/HtmlComponents/HTMLTableCell";
import HTMLTableRow from "@ext/markdown/elements/table/render/HtmlComponents/HTMLTableRow";
import { TableDB } from "@ext/markdown/elements/tabledb/render/DbTable";
import HTMLTabs from "@ext/markdown/elements/tabs/render/components/HTMLTabs";
import HTMLTerm from "@ext/markdown/elements/term/render/HTMLTerm";
import HTMLVideo from "@ext/markdown/elements/video/render/components/HTMLVideo";
import HTMLWhen from "@ext/markdown/elements/whowhen/render/HTMLWhen";
import HTMLWho from "@ext/markdown/elements/whowhen/render/HTMLWho";
import type { ReactNode } from "react";
import type ParserContext from "../../../Parser/ParserContext/ParserContext";
import HTMLComponents, { unSupportedElements } from "./HTMLComponents";

const getComponentsHTML = (
	requestURL?: string,
	context?: ParserContext,
	// biome-ignore lint/suspicious/noExplicitAny: dynamic component registry requires any
): { [name: string]: (props: any) => ReactNode } => {
	if (!context) {
		return {};
	}
	const html = new HTMLComponents(requestURL, context);

	return {
		Br: HTMLBr,
		Color: HTMLColor,
		Formula: HTMLFormula,
		code_block: HTMLFence,
		fragment: HTMLFragment,
		"Fragment-link": HTMLFragmentLink,
		Code: HTMLCode,
		Alfa: HTMLAlfa,
		Beta: HTMLBeta,
		Sub: HTMLSub,
		Cmd: HTMLCmd(html),
		Cut: HTMLCut,
		icon: HTMLIcon(html),
		"inline-property": HTMLInlineProperty,
		"block-field": HTMLBlockField,
		"block-property": HTMLBlockProperty,
		inlineImage: HTMLImage(html),
		Issue: HTMLIssue(html),
		Module: HTMLModule(html),
		Who: HTMLWho(html),
		When: HTMLWhen(html),
		Kbd: HTMLKbd,
		html: HtmlBlock,
		highlight: HTMLHighlight,
		inlineHtmlTag: HtmlTag,
		blockHtmlTag: HtmlTag,
		blockWithInlineHtmlTag: HtmlTag,
		selfClosingHtmlTag: HtmlTag,
		View: () => <div data-component="view" data-unsupported="true"></div>,
		Image: HTMLImage(html),
		"Img-h": () => <div data-component="images" data-unsupported="true"></div>,
		"Img-v": () => <div data-component="images" data-unsupported="true"></div>,
		See,
		Li: HTMLLi,
		listItem: HTMLListItem,
		taskItem: HTMLTaskItem,
		bulletList: HTMLBulletList,
		taskList: HTMLTaskList,
		orderedList: HTMLOrderedList,
		openApi: html.getNullComponent(unSupportedElements.openApi),
		note: HTMLNote(html),
		Alert: HTMLAlert(html),
		Unsupported: (props) => <div data-component="unsupported">{props.children}</div>,
		tabs: HTMLTabs,
		tab: html.getNullComponent(unSupportedElements.tab),
		Video: HTMLVideo,
		Heading: HTMLHeading,
		drawio: HTMLDrawio(html),
		Term: HTMLTerm,
		Error: HTMLError,
		table: HTMLTable,
		tableCell: HTMLTableCell,
		tableRow: HTMLTableRow,
		Include: HTMLInclude,
		"Db-table": TableDB,
		"Db-diagram": html.getNullComponent(unSupportedElements["db-diagram"]),
		diagrams: (props: { diagramName: DiagramType; src?: string; title: string; content?: string }) => {
			const { diagramName, src, title, content } = props;
			const name = unSupportedElements[diagramName[0].toLowerCase() + diagramName.slice(1)];

			return html.getNullComponent(name)({ src, title, content });
		},
		Link: HTMLLink(html),
	};
};

export default getComponentsHTML;
