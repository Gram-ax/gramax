import Br from "@ext/markdown/elements/br/edit/br";
import ExtendedCodeBlockLowlight from "@ext/markdown/elements/codeBlockLowlight/edit/model/codeBlockLowlight";
import ArticleSearch from "@ext/markdown/elements/find/edit/models/ArticleSearch";
import { Extensions } from "@tiptap/react";
import History from "@tiptap/extension-history";
import Text from "@tiptap/extension-text";
import GramaxAi from "@ext/ai/logic/GramaxAiExtension";
import DocKeyboardShortcuts from "@ext/markdown/elements/article/edit/DocKeyboardShortcuts";
import DragScroller from "@ext/markdown/elements/article/edit/DragScroller";
import BlockContentField from "@ext/markdown/elements/blockContentField/edit/models/blockField";
import BlockProperty from "@ext/markdown/elements/blockProperty/edit/models/blockProperty";
import HardBreak from "@ext/markdown/elements/br/edit/hardBreak";
import Code from "@ext/markdown/elements/code/edit/model/code";
import Color from "@ext/markdown/elements/color/edit/model/color";
import CopyMsO from "@ext/markdown/elements/copyMsO/copyMsO";
import InlineCutComponent from "@ext/markdown/elements/cut/edit/model/inlineCut";
import Diagrams from "@ext/markdown/elements/diagrams/edit/models/diagrams";
import DisableMarksForInlineComponents from "@ext/markdown/elements/disableMarksForInlineComponents/disableMarksForInlineComponents";
import Drawio from "@ext/markdown/elements/drawio/edit/model/drawio";
import { Dropcursor } from "@ext/markdown/elements/dropCursor";
import Em from "@ext/markdown/elements/em/edit/em";
import File from "@ext/markdown/elements/file/edit/model/file";
import GapParagraph from "@ext/markdown/elements/gapParagraph/plugin";
import Heading from "@ext/markdown/elements/heading/edit/model/heading";
import Highlight from "@ext/markdown/elements/highlight/edit/model/mark";
import HorizontalRule from "@ext/markdown/elements/hr/edit/horizontalRule";
import Html from "@ext/markdown/elements/html/edit/models/html";
import { BlockHtmlTag, InlineHtmlTag } from "@ext/markdown/elements/htmlTag/edit/model/htmlTag";
import Icon from "@ext/markdown/elements/icon/edit/model/icon";
import Image from "@ext/markdown/elements/image/edit/model/image";
import InlineImage from "@ext/markdown/elements/inlineImage/edit/models/node";
import InlineProperty from "@ext/markdown/elements/inlineProperty/edit/models/inlineProperty";
import { JoinLists } from "@ext/markdown/elements/joinLists/joinLists";
import LineBreakers from "@ext/markdown/elements/lineBreakers/lineBreakers";
import LinkComponent from "@ext/markdown/elements/link/edit/model/link";
import CustomBulletList from "@ext/markdown/elements/list/edit/models/bulletList/model/customBulletList";
import CustomListItem from "@ext/markdown/elements/list/edit/models/listItem/model/listItem";
import CustomOrderList from "@ext/markdown/elements/list/edit/models/orderList/model/customOrderList";
import CustomTaskList from "@ext/markdown/elements/list/edit/models/taskList/model/customTaskList";
import BlockMd from "@ext/markdown/elements/md/model/blockMd";
import InlineMdComponent from "@ext/markdown/elements/md/model/inlineMd";
import ArrowsMove from "@ext/markdown/elements/moveNode/model/ArrowsMove";
import NoteComponent from "@ext/markdown/elements/note/edit/model/note";
import OpenApi from "@ext/markdown/elements/openApi/edit/models/openApi";
import Paragraph from "@ext/markdown/elements/paragraph/edit/model/paragraph";
import PasteMarkdown from "@ext/markdown/elements/pasteMarkdown/pasteMarkdown";
import Snippet from "@ext/markdown/elements/snippet/edit/model/snippet";
import Strike from "@ext/markdown/elements/strikethrough/edit/strike";
import Strong from "@ext/markdown/elements/strong/edit/strong";
import CustomTable from "@ext/markdown/elements/table/edit/model/nodes/customTable";
import CustomTableCell from "@ext/markdown/elements/table/edit/model/nodes/customTableCell";
import CustomTableRow from "@ext/markdown/elements/table/edit/model/nodes/customTableRow";
import TableKeyboardShortcuts from "@ext/markdown/elements/table/edit/model/TableKeyboardShortcuts";
import Tab from "@ext/markdown/elements/tabs/edit/model/tab/tab";
import Tabs from "@ext/markdown/elements/tabs/edit/model/tabs/tabs";
import Typography from "@ext/markdown/elements/typography/typography";
import UnsupportedComponent from "@ext/markdown/elements/unsupported/edit/model/unsupported";
import VideoComponent from "@ext/markdown/elements/video/edit/model/video";
import View from "@ext/markdown/elements/view/edit/models/view";
import { Suggestion } from "@ext/StyleGuide/extension/Suggestion";
import { FloatExtension } from "@ext/markdown/elements/float/edit/model/extension";

export interface GetExtensionsPropsOptions {
	includeResources?: boolean;
	isTemplateInstance?: boolean;
}

// All extensions for editor like article editor, template editor, etc.
const getExtensions = (options?: GetExtensionsPropsOptions): Extensions => [
	...getSimpleExtensions(),
	InlineHtmlTag,
	BlockHtmlTag,
	DocKeyboardShortcuts,
	InlineCutComponent,
	InlineMdComponent,
	BlockMd,
	VideoComponent,
	NoteComponent,
	ArticleSearch,
	UnsupportedComponent,
	LinkComponent,
	ArrowsMove,
	JoinLists,
	ExtendedCodeBlockLowlight,
	DragScroller,
	Dropcursor,
	Tabs,
	Tab,
	Suggestion,
	Snippet,
	CustomTableCell,
	CustomTableRow,
	TableKeyboardShortcuts,
	CustomTable,

	CopyMsO,
	PasteMarkdown,
	Heading,
	Html,
	View,
	GapParagraph,
	GramaxAi,
	FloatExtension,

	...(options?.includeResources ? getResourcesExtensions() : []),

	...(options?.isTemplateInstance !== undefined ? getTemplateExtensions(!options.isTemplateInstance) : []),
];

// Base extensions for simple editor like comment editor
export const getSimpleExtensions = (): Extensions => [
	CustomOrderList,
	CustomBulletList,
	CustomTaskList,
	CustomListItem,
	Strong,
	Strike,
	Text,
	Code,
	Br,
	Paragraph,
	LineBreakers,
	DisableMarksForInlineComponents,
	HardBreak,
	Em,
	History,
	Typography,
	Color,
	HorizontalRule,
	Highlight,
];

// Extensions for template editor logic
export const getTemplateExtensions = (readOnly: boolean = true): Extensions => [
	BlockContentField.configure({ editable: !readOnly }),
	InlineProperty.configure({ canChangeProps: !readOnly }),
	BlockProperty.configure({ canChangeProps: !readOnly }),
];

// Extensions which used resource service
export const getResourcesExtensions = (): Extensions => [Image, File, Icon, Diagrams, Drawio, OpenApi, InlineImage];

export default getExtensions;
