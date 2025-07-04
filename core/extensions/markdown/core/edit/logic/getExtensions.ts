import Br from "@ext/markdown/elements/br/edit/br";
import ExtendedCodeBlockLowlight from "@ext/markdown/elements/codeBlockLowlight/edit/model/codeBlockLowlight";
import ArticleSearch from "@ext/markdown/elements/find/edit/models/ArticleSearch";
import { Extensions } from "@tiptap/react";

import History from "@tiptap/extension-history";
import OrderedList from "@tiptap/extension-ordered-list";
import TaskList from "@tiptap/extension-task-list";
import Text from "@tiptap/extension-text";

import GramaxAi from "@ext/ai/logic/GramaxAiExtension";
import DocKeyboardShortcuts from "@ext/markdown/elements/article/edit/DocKeyboardShortcuts";
import DragScroller from "@ext/markdown/elements/article/edit/DragScroller";
import BlockContentField from "@ext/markdown/elements/blockContentField/edit/models/blockField";
import HardBreak from "@ext/markdown/elements/br/edit/hardBreak";
import Code from "@ext/markdown/elements/code/edit/model/code";
import Color from "@ext/markdown/elements/color/edit/model/color";
import Comment from "@ext/markdown/elements/comment/edit/model/comment";
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
import HorizontalRule from "@ext/markdown/elements/hr/edit/horizontalRule";
import Html from "@ext/markdown/elements/html/edit/models/html";
import { BlockHtmlTag, InlineHtmlTag } from "@ext/markdown/elements/htmlTag/edit/model/htmlTag";
import Icon from "@ext/markdown/elements/icon/edit/model/icon";
import Image from "@ext/markdown/elements/image/edit/model/image";
import InlineProperty from "@ext/markdown/elements/inlineProperty/edit/models/inlineProperty";
import { JoinLists } from "@ext/markdown/elements/joinLists/joinLists";
import LineBreakers from "@ext/markdown/elements/lineBreakers/lineBreakers";
import LinkComponent from "@ext/markdown/elements/link/edit/model/link";
import CustomBulletList from "@ext/markdown/elements/list/edit/models/bulletList/model/customBulletList";
import CustomListItem from "@ext/markdown/elements/list/edit/models/listItem/model/listItem";
import CustomTaskItem from "@ext/markdown/elements/list/edit/models/taskItem/model/taskItem";
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
import BlockProperty from "@ext/markdown/elements/blockProperty/edit/models/blockProperty";
import InlineImage from "@ext/markdown/elements/inlineImage/edit/models/node";

export interface GetExtensionsPropsOptions {
	includeResources?: boolean;
	isTemplateInstance?: boolean;
}

const getExtensions = (options?: GetExtensionsPropsOptions): Extensions => [
	InlineHtmlTag,
	BlockHtmlTag,
	DocKeyboardShortcuts,
	InlineCutComponent,
	InlineMdComponent,
	BlockMd,
	VideoComponent,
	HorizontalRule,
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
	Color,
	Br,
	Snippet,
	CustomTableCell,
	CustomTableRow,
	TableKeyboardShortcuts,
	CustomTable,

	DisableMarksForInlineComponents,
	LineBreakers,
	CopyMsO,
	PasteMarkdown,
	Typography,
	Paragraph,
	History,
	Heading,
	Strong,
	Strike,
	Code,
	Html,
	View,
	Text,
	Em,
	GapParagraph,
	HardBreak,
	OrderedList,
	CustomBulletList,
	TaskList,
	CustomTaskItem,
	CustomListItem,
	Comment,
	GramaxAi,

	...(options?.includeResources ? getResourcesExtensions() : []),

	...(options?.isTemplateInstance !== undefined ? getTemplateExtensions(options.isTemplateInstance) : []),
];

export const getTemplateExtensions = (isTemplateInstance: boolean): Extensions => [
	BlockContentField.configure({ editable: isTemplateInstance ?? false }),
	InlineProperty.configure({ canChangeProps: isTemplateInstance ?? false }),
	BlockProperty.configure({ canChangeProps: isTemplateInstance ?? false }),
];

export const getResourcesExtensions = (): Extensions => [Image, File, Icon, Diagrams, Drawio, OpenApi, InlineImage];

export default getExtensions;
