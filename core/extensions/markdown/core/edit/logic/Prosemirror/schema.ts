import alertSchema from "@ext/markdown/elements/alert/edit/model/alertSchema";
import doc from "@ext/markdown/elements/article/edit/doc";
import blockFieldSchema from "@ext/markdown/elements/blockContentField/edit/models/blockFieldSchema";
import blockPropertySchema from "@ext/markdown/elements/blockProperty/edit/models/blockPropertySchema";
import blockquote from "@ext/markdown/elements/blockquote/editor/model/blockquoteSchema";
import br from "@ext/markdown/elements/br/edit/model/brSchema";
import code_block from "@ext/markdown/elements/codeBlockLowlight/edit/model/schema";
import color from "@ext/markdown/elements/color/edit/model/colorSchema";
import comment from "@ext/markdown/elements/comment/edit/model/commentSchema";
import answer from "@ext/markdown/elements/comment/legacy/answer/edit/answerSchema";
import comment_old from "@ext/markdown/elements/comment/legacy/comment/commentShema";
import cut from "@ext/markdown/elements/cut/edit/model/cutSchema";
import inlineCut_component from "@ext/markdown/elements/cut/edit/model/inlineCutSchema";
import c4Diagram from "@ext/markdown/elements/diagrams/diagrams/c4Diagram/c4DiagramSchema";
import mermaid from "@ext/markdown/elements/diagrams/diagrams/mermaid/mermaidSchema";
import plantUml from "@ext/markdown/elements/diagrams/diagrams/plantUml/plantUmlSchema";
import tsDiagram from "@ext/markdown/elements/diagrams/diagrams/tsDiagram/tsDiagramSchema";
import diagramsSchema from "@ext/markdown/elements/diagrams/edit/models/diagramsSchema";
import drawioSchema from "@ext/markdown/elements/drawio/edit/model/drawioSchema";
import error from "@ext/markdown/elements/error/editor/model/errorSchema";
import file from "@ext/markdown/elements/file/edit/model/fileSchema";
import heading from "@ext/markdown/elements/heading/edit/model/headingSchema";
import horizontal_rule from "@ext/markdown/elements/hr/edit/model/hrSchema";
import htmlSchema from "@ext/markdown/elements/html/edit/models/htmlSchema";
import icon from "@ext/markdown/elements/icon/edit/model/iconSchema";
import imageSchema from "@ext/markdown/elements/image/edit/model/imageSchema";
import inlinePropertySchema from "@ext/markdown/elements/inlineProperty/edit/models/inlinePropertySchema";
import link from "@ext/markdown/elements/link/edit/model/linkSchema";
import * as listSchema from "@ext/markdown/elements/list/edit/models/listSchema";
import blockMd from "@ext/markdown/elements/md/model/blockMdSchema";
import inlineMd_component from "@ext/markdown/elements/md/model/inlineMdSchema";
import note from "@ext/markdown/elements/note/edit/model/noteSchema";
import openApiSchema from "@ext/markdown/elements/openApi/edit/models/openApiSchema";
import paragraphSchema from "@ext/markdown/elements/paragraph/editor/model/paragraphSchema";
import snippetSchema from "@ext/markdown/elements/snippet/edit/model/snippetSchema";
import * as table_simple from "@ext/markdown/elements/table/edit/model/simpleTableSchema";
import * as table from "@ext/markdown/elements/table/edit/model/tableSchema";
import tabSchema from "@ext/markdown/elements/tabs/edit/model/tab/tabSchema";
import tabsSchema from "@ext/markdown/elements/tabs/edit/model/tabs/tabsSchema";
import unsupported from "@ext/markdown/elements/unsupported/edit/model/unsupportedSchema";
import videoSchema from "@ext/markdown/elements/video/edit/model/videoSchema";
import viewSchema from "@ext/markdown/elements/view/edit/models/viewSchema";
import suggestion from "@ext/StyleGuide/extension/suggestionSchema";
import { Schema } from "prosemirror-model";
import htmlTags from "@ext/markdown/elements/htmlTag/render/model/htmlTagSchema";
import * as htmlTagsComponents from "@ext/markdown/elements/htmlTag/edit/model/htmlTagSchema";
import inlineImageSchema from "@ext/markdown/elements/inlineImage/edit/models/schema";

export const getSchema = (additionalSchema?: Record<string, any>) => {
	const schema = {
		nodes: {
			doc,

			tab: tabSchema,
			tabs: tabsSchema,

			heading,
			paragraph: paragraphSchema,
			text: { group: "inline" },

			br,
			horizontal_rule,
			hard_break: { inline: true, group: "inline", selectable: false },

			...table,
			...table_simple,
			...listSchema,

			openapi: openApiSchema,
			snippet: snippetSchema,
			diagrams: diagramsSchema,
			mermaid,
			"plant-uml": plantUml,
			"c4-diagram": c4Diagram,
			"ts-diagram": tsDiagram,

			"inline-property": inlinePropertySchema,
			"block-property": blockPropertySchema,

			// "db-diagram": blockMd("db-diagram"),
			// "db-table": blockMd("db-table"),
			// "img-h": blockMd("img-h"),
			// "img-v": blockMd("img-v"),
			// formula: blockMd("formula"),
			// module: inlineMd("module"),
			// term: inlineMd("term"),
			// issue: inlineMd("issue"),
			// alfa: inlineMd("alfa"),
			// beta: inlineMd("beta"),
			// when: inlineMd("when"),
			// who: inlineMd("who"),
			// cmd: inlineMd("cmd"),
			// kbd: inlineMd("kbd"),
			// see: inlineMd("see"),
			// fn: inlineMd("fn"),

			"block-field": blockFieldSchema,

			alert: alertSchema,

			video: videoSchema,
			image: imageSchema,
			inlineImage: inlineImageSchema,
			drawio: drawioSchema,

			icon,
			cut,
			note,
			unsupported,
			html: htmlSchema,
			view: viewSchema,
			code_block,
			blockquote,

			error,
			answer,
			comment_old,

			...htmlTags,
			...htmlTagsComponents,

			blockMd,
			inlineMd_component,
			inlineCut_component,
			...(additionalSchema?.nodes ?? {}),
		},
		marks: {
			color,
			link,
			comment,
			suggestion,
			s: {},
			em: {},
			code: {},
			strong: {},
			inlineMd: {},
			file,
			inlineCut: { attrs: inlineCut_component.attrs },
			...(additionalSchema?.marks ?? {}),
		},
	};

	return new Schema(schema);
};
