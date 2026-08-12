import type DiagramType from "@core/components/Diagram/DiagramType";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import HTMLAlert from "@ext/markdown/elements/alert/render/component/HTMLAlert";
import HTMLBlockField from "@ext/markdown/elements/blockContentField/render/components/HTMLBlockField";
import HTMLBlockProperty from "@ext/markdown/elements/blockProperty/render/components/HTMLBlockProperty";
import HTMLBr from "@ext/markdown/elements/br/render/components/HTMLBr";
import HTMLCode from "@ext/markdown/elements/code/render/components/HTMLCode";
import HTMLColor from "@ext/markdown/elements/color/render/components/HTMLColor";
import HTMLCut from "@ext/markdown/elements/cut/render/components/HTMLCut";
import HTMLDrawio from "@ext/markdown/elements/drawio/render/components/HTMLDrawio";
import HTMLError from "@ext/markdown/elements/error/render/HTMLError";
import HTMLFence from "@ext/markdown/elements/fence/render/components/HTMLFence";
import HTMLFragment from "@ext/markdown/elements/fragment/render/components/HTMLFragment";
import HTMLFragmentLink from "@ext/markdown/elements/fragment-link/render/components/HTMLFragmentLink";
import HTMLHeading from "@ext/markdown/elements/heading/render/components/HTMLHeading";
import HTMLHighlight from "@ext/markdown/elements/highlight/render/components/HTMLHighlight";
import HtmlBlock from "@ext/markdown/elements/html/render/components/HTML";
import HtmlTag from "@ext/markdown/elements/htmlTag/render/component/HtmlTag";
import { HTMLIcon } from "@ext/markdown/elements/icon/render/components/HTMLIcon";
import HTMLImage from "@ext/markdown/elements/image/render/components/HTMLImage";
import HTMLInlineProperty from "@ext/markdown/elements/inlineProperty/render/components/HTMLInlineProperty";
import HTMLLink from "@ext/markdown/elements/link/render/components/HTMLLink";
import {
	HTMLBulletList,
	HTMLLi,
	HTMLListItem,
	HTMLOrderedList,
	HTMLTaskItem,
	HTMLTaskList,
} from "@ext/markdown/elements/list/render/HTMLLists";
import getMdHTMLComponents from "@ext/markdown/elements/md/render/getComponents/getMdHTMLComponents";
import HTMLNote from "@ext/markdown/elements/note/render/components/HTMLNote";
import HTMLTable from "@ext/markdown/elements/table/render/HtmlComponents/HTMLTable";
import HTMLTableCell from "@ext/markdown/elements/table/render/HtmlComponents/HTMLTableCell";
import HTMLTableRow from "@ext/markdown/elements/table/render/HtmlComponents/HTMLTableRow";
import HTMLTabs from "@ext/markdown/elements/tabs/render/components/HTMLTabs";
import HTMLVideo from "@ext/markdown/elements/video/render/components/HTMLVideo";
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

	const mdHTMLComponent = getMdHTMLComponents(html);
	const getMdHTMLComponent = (props) => Renderer(props.tag, { components: mdHTMLComponent });
	return {
		Br: HTMLBr,
		Color: HTMLColor,
		// biome-ignore lint/style/useNamingConvention: expected
		inlineMd_component: getMdHTMLComponent,
		blockMd: getMdHTMLComponent,
		code_block: HTMLFence,
		fragment: HTMLFragment,
		"Fragment-link": HTMLFragmentLink,
		Code: HTMLCode,
		Cut: HTMLCut,
		icon: HTMLIcon(html),
		"inline-property": HTMLInlineProperty,
		"block-field": HTMLBlockField,
		"block-property": HTMLBlockProperty,
		inlineImage: HTMLImage(html),
		html: HtmlBlock,
		highlight: HTMLHighlight,
		inlineHtmlTag: HtmlTag,
		blockHtmlTag: HtmlTag,
		blockWithInlineHtmlTag: HtmlTag,
		selfClosingHtmlTag: HtmlTag,
		View: () => <div data-component="view" data-unsupported="true"></div>,
		Image: HTMLImage(html),
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
		Error: HTMLError,
		table: HTMLTable,
		tableCell: HTMLTableCell,
		tableRow: HTMLTableRow,
		diagrams: (props: { diagramName: DiagramType; src?: string; title: string; content?: string }) => {
			const { diagramName, src, title, content } = props;
			const name = unSupportedElements[diagramName[0].toLowerCase() + diagramName.slice(1)];

			return html.getNullComponent(name)({ src, title, content });
		},
		Link: HTMLLink(html),
	};
};

export default getComponentsHTML;
