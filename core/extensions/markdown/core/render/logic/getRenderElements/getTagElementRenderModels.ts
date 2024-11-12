import { alfa, beta } from "@ext/markdown/elements/alfaBeta/alfaBeta";
import { br } from "@ext/markdown/elements/br/render/br";
import { cmd } from "@ext/markdown/elements/cmd/model/cmd";
import { color } from "@ext/markdown/elements/color/model/color";
import { answer } from "@ext/markdown/elements/comment/legacy/answer/render/answer";
import { comment } from "@ext/markdown/elements/comment/render/comment";
import { cut } from "@ext/markdown/elements/cut/render/model/cut";
import { dbDiagram } from "@ext/markdown/elements/diagramdb/model/diagramdb";
import { c4Diagram } from "@ext/markdown/elements/diagrams/diagrams/c4Diagram/c4Diagram";
import { mermaid } from "@ext/markdown/elements/diagrams/diagrams/mermaid/mermaid";
import { plantUml } from "@ext/markdown/elements/diagrams/diagrams/plantUml/plantUml";
import { tsDiagram } from "@ext/markdown/elements/diagrams/diagrams/tsDiagram/tsDiagram";
import { drawio } from "@ext/markdown/elements/drawio/render/model/drawio";
import { error } from "@ext/markdown/elements/error/error";
import { fn } from "@ext/markdown/elements/fn/model/fn";
import { formula } from "@ext/markdown/elements/formula/model/formula";
import { icon } from "@ext/markdown/elements/icon/render/model/icon";
import { imgs } from "@ext/markdown/elements/imgs/model/imgs";
import { include } from "@ext/markdown/elements/include/model/include";
import { issue } from "@ext/markdown/elements/issue/model/issue";
import { kbd } from "@ext/markdown/elements/kbd/model/kbd";
import { module } from "@ext/markdown/elements/module/model/module";
import { note } from "@ext/markdown/elements/note/render/model/note";
import { OpenApi } from "@ext/markdown/elements/openApi/render/model/OpenApi";
import { see } from "@ext/markdown/elements/see/model/see";
import { snippet } from "@ext/markdown/elements/snippet/render/model/snippet";
import { tabledb } from "@ext/markdown/elements/tabledb/model/tabledb";
import { tab, tabs } from "@ext/markdown/elements/tabs/render/model/tabs";
import { term } from "@ext/markdown/elements/term/model/term";
import { video } from "@ext/markdown/elements/video/render/model/video";
import { when, who } from "@ext/markdown/elements/whowhen/model/whowhen";
import ParserContext from "../../../Parser/ParserContext/ParserContext";
import { Schema } from "../Markdoc";
import { image } from "@ext/markdown/elements/image/render/image";
import { alert } from "@ext/markdown/elements/alert/render/model/alert";
import { unsupported } from "@ext/markdown/elements/unsupported/render/model/unsupported";
import { html } from "@ext/markdown/elements/html/render/models/html";
import { view } from "@ext/markdown/elements/view/render/models/view";

function getContextTagElementRenderModels(context: ParserContext): Record<string, Schema> {
	return {
		"ts-diagram": tsDiagram(context),
		"db-diagram": dbDiagram(context),
		"c4-diagram": c4Diagram(context),
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

export default function getTagElementRenderModels(context?: ParserContext): Record<string, Schema> {
	const contextElements = context ? getContextTagElementRenderModels(context) : {};
	return {
		comment,
		answer,
		module,
		issue,
		color,
		video,
		note,
		alert,
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
		fn,
		...contextElements,
	};
}
