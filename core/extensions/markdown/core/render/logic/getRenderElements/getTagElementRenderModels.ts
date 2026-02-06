import { alert } from "@ext/markdown/elements/alert/render/model/alert";
import { alfa, beta } from "@ext/markdown/elements/alfaBeta/alfaBeta";
import { questionAnswer } from "@ext/markdown/elements/answer/render/models/answer";
import { blockField } from "@ext/markdown/elements/blockContentField/render/models/blockField";
import { blockProperty } from "@ext/markdown/elements/blockProperty/render/models/blockProperty";
import { br } from "@ext/markdown/elements/br/render/br";
import { cmd } from "@ext/markdown/elements/cmd/model/cmd";
import { color } from "@ext/markdown/elements/color/render/model/color";
import { answer } from "@ext/markdown/elements/comment/legacy/answer/render/answer";
import { comment } from "@ext/markdown/elements/comment/render/comment";
import { cut } from "@ext/markdown/elements/cut/render/model/cut";
import { dbDiagram } from "@ext/markdown/elements/diagramdb/model/diagramdb";
import { mermaid } from "@ext/markdown/elements/diagrams/diagrams/mermaid/mermaid";
import { plantUml } from "@ext/markdown/elements/diagrams/diagrams/plantUml/plantUml";
import { drawio } from "@ext/markdown/elements/drawio/render/model/drawio";
import { error } from "@ext/markdown/elements/error/error";
import { formula } from "@ext/markdown/elements/formula/model/formula";
import { highlight } from "@ext/markdown/elements/highlight/render/model/schema";
import { html } from "@ext/markdown/elements/html/render/models/html";
import {
	blockHtmlTag,
	blockHtmlTagComponent,
	blockWithInlineHtmlTag,
	inlineHtmlTag,
	inlineHtmlTagComponent,
	selfClosingHtmlTag,
} from "@ext/markdown/elements/htmlTag/render/model/htmlTag";
import { icon } from "@ext/markdown/elements/icon/render/model/icon";
import { image } from "@ext/markdown/elements/image/render/image";
import { imgs } from "@ext/markdown/elements/imgs/model/imgs";
import { include } from "@ext/markdown/elements/include/model/include";
import { inlineProperty } from "@ext/markdown/elements/inlineProperty/render/models/inlineProperty";
import { issue } from "@ext/markdown/elements/issue/model/issue";
import { kbd } from "@ext/markdown/elements/kbd/model/kbd";
import { module } from "@ext/markdown/elements/module/model/module";
import { note } from "@ext/markdown/elements/note/render/model/note";
import { OpenApi } from "@ext/markdown/elements/openApi/render/model/OpenApi";
import { question } from "@ext/markdown/elements/question/render/models/question";
import { see } from "@ext/markdown/elements/see/model/see";
import { snippet } from "@ext/markdown/elements/snippet/render/model/snippet";
import { col, colgroup, table, td, tr } from "@ext/markdown/elements/table/render/model/table";
import { tabledb } from "@ext/markdown/elements/tabledb/model/tabledb";
import { tab, tabs } from "@ext/markdown/elements/tabs/render/model/tabs";
import { term } from "@ext/markdown/elements/term/model/term";
import { unsupported } from "@ext/markdown/elements/unsupported/render/model/unsupported";
import { video } from "@ext/markdown/elements/video/render/model/video";
import { view } from "@ext/markdown/elements/view/render/models/view";
import { when, who } from "@ext/markdown/elements/whowhen/model/whowhen";
import PrivateParserContext from "../../../Parser/ParserContext/PrivateParserContext";
import { Schema } from "../Markdoc";

function getContextTagElementRenderModels(context: PrivateParserContext): Record<string, Schema> {
	return {
		"db-diagram": dbDiagram(context),
		"plant-uml": plantUml(context),
		"db-table": tabledb(context),
		"img-h": imgs(context, "h"),
		"img-v": imgs(context, "v"),
		image: image(context),
		openapi: OpenApi(context),
		mermaid: mermaid(context),
		include: include(context),
		snippet: snippet(context),
		formula: formula(context),
		drawio: drawio(context),
		error: error(context),
		term: term(context),
		icon: icon(context),
	};
}

export default function getTagElementRenderModels(context?: PrivateParserContext): Record<string, Schema> {
	const contextElements = context ? getContextTagElementRenderModels(context) : {};

	return {
		inlineHtmlTagComponent,
		blockWithInlineHtmlTag,
		blockHtmlTagComponent,
		selfClosingHtmlTag,
		inlineHtmlTag,
		blockHtmlTag,
		comment,
		answer,
		module,
		issue,
		color,
		highlight,
		video,
		note,
		alert,
		table,
		tr,
		td,
		col,
		colgroup,
		unsupported,
		html,
		view,
		alfa,
		beta,
		when,
		tabs,
		tab,
		cut,
		cmd,
		who,
		kbd,
		see,
		br,
		questionAnswer: questionAnswer(),
		question: question(),
		"inline-property": inlineProperty,
		"block-field": blockField,
		"block-property": blockProperty,
		...contextElements,
	};
}
