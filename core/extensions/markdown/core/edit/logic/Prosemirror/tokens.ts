import fenceToken from "@ext/markdown/elements/codeBlockLowlight/edit/logic/token";
import codeBlockToken from "@ext/markdown/elements/codeBlockLowlight/edit/model/token";
import { bulletList } from "@ext/markdown/elements/list/edit/models/bulletList/bulletListToken";
import { listItem } from "@ext/markdown/elements/list/edit/models/listItem/model/listItemToken";
import { taskItem } from "@ext/markdown/elements/list/edit/models/taskItem/model/taskItemToken";
import { taskList } from "@ext/markdown/elements/list/edit/models/taskList/model/taskListToken";
import commentToken from "../../../../elements/comment/edit/model/commentToken";
import c4DiagramToken from "../../../../elements/diagrams/diagrams/c4Diagram/c4DiagramToken";
import mermaidToken from "../../../../elements/diagrams/diagrams/mermaid/mermaidToken";
import plantUmlToken from "../../../../elements/diagrams/diagrams/plantUml/plantUmlToken";
import tsDiagramToken from "../../../../elements/diagrams/diagrams/tsDiagram/tsDiagramToken";

import answer from "../../../../elements/comment/legacy/answer/edit/answerToken";
import comment_old from "../../../../elements/comment/legacy/comment/commentToken";

import openApiToken from "@ext/markdown/elements/openApi/edit/models/openApiToken";
import diagramsToken from "../../../../elements/diagrams/edit/models/diagramsToken";
import drawioToken from "../../../../elements/drawio/edit/model/drawioToken";
import imageToken from "../../../../elements/image/edit/model/imageToken";
import linkToken from "../../../../elements/link/edit/model/linkToken";
import video from "../../../../elements/video/edit/model/videoToken";
import ParserContext from "../../../Parser/ParserContext/ParserContext";

import alertToken from "@ext/markdown/elements/alert/edit/model/alertToken";
import blockFieldToken from "@ext/markdown/elements/blockContentField/edit/models/blockFieldToken";
import colorToken from "@ext/markdown/elements/color/edit/model/colorToken";
import htmlToken from "@ext/markdown/elements/html/edit/models/htmlToken";
import htmlTagTokens from "@ext/markdown/elements/htmlTag/edit/model/htmlTagTokens";
import iconToken from "@ext/markdown/elements/icon/edit/model/iconToken";
import inlinePropertyToken from "@ext/markdown/elements/inlineProperty/edit/models/inlinePropertyToken";
import noteToken from "@ext/markdown/elements/note/edit/model/noteToken";
import snippetToken from "@ext/markdown/elements/snippet/edit/model/snippetToken";
import tableTokens from "@ext/markdown/elements/table/edit/model/tableTokens";
import tabToken from "@ext/markdown/elements/tabs/edit/model/tab/tabToken";
import tabsToken from "@ext/markdown/elements/tabs/edit/model/tabs/tabsToken";
import unsupportedToken from "@ext/markdown/elements/unsupported/edit/model/unsupportedToken";
import viewToken from "@ext/markdown/elements/view/edit/models/viewToken";
import { ParseSpec } from "./from_markdown";
import blockPropertyToken from "@ext/markdown/elements/blockProperty/edit/models/blockPropertyToken";
import inlineImageToken from "@ext/markdown/elements/inlineImage/edit/models/token";

function listIsTight(tokens, i) {
	while (++i < tokens.length) if (tokens[i].type != "list_item_open") return tokens[i].hidden;
	return false;
}

const getTokensByContext = (context?: ParserContext): { [name: string]: ParseSpec } => {
	return {
		comment: commentToken(context),
		snippet: snippetToken(context),
		icon: iconToken(context),
	};
};

export const getTokens = (context?: ParserContext): { [name: string]: ParseSpec } => {
	const contextTokens = context ? getTokensByContext(context) : {};

	return {
		link: linkToken(context),
		tab: tabToken,
		note: noteToken,
		unsupported: unsupportedToken,
		tabs: tabsToken,
		image: imageToken(),
		inlineImage: inlineImageToken(),
		fence: fenceToken(),
		drawio: drawioToken(),
		openapi: openApiToken,
		code_block: codeBlockToken,
		mermaid: mermaidToken,
		diagrams: diagramsToken,
		html: htmlToken,
		view: viewToken,
		"plant-uml": plantUmlToken,
		"c4-diagram": c4DiagramToken,
		"ts-diagram": tsDiagramToken,
		"inline-property": inlinePropertyToken(),
		"block-field": blockFieldToken(),
		"block-property": blockPropertyToken(),
		alert: alertToken(),

		br: { node: "br" },

		cut: {
			block: "cut",
			getAttrs: (tok) => {
				return { ...tok.attrs, isInline: false };
			},
		},
		...htmlTagTokens,
		blockMd: { node: "blockMd", getAttrs: (tok) => tok.attrs },
		...tableTokens,
		blockquote: { block: "blockquote" },
		paragraph: { block: "paragraph" },
		error: { block: "error" },
		list_item: listItem,
		task_item: taskItem,
		task_list: taskList,
		bullet_list: bulletList,
		ordered_list: {
			block: "orderedList",
			getAttrs: (tok, tokens, i) => ({
				order: +tok.attrGet("start") || 1,
				tight: listIsTight(tokens, i),
			}),
		},
		heading: { block: "heading", getAttrs: (tok) => ({ level: +tok.tag.slice(1) }) },

		hr: { node: "horizontal_rule" },

		hardbreak: { node: "hard_break" },
		s: { mark: "s" },
		em: { mark: "em" },
		inlineMd: { mark: "inlineMd" },
		inlineCut: {
			mark: "inlineCut",
			getAttrs: (tok) => {
				return { ...tok.attrs, isInline: true };
			},
		},

		color: colorToken,
		strong: { mark: "strong" },
		code_inline: { mark: "code", noCloseToken: true },

		video,
		...contextTokens,

		answer,
		comment_old,
	};
};
