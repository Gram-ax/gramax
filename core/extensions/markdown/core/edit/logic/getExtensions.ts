import GramaxAi from "@ext/ai/logic/GramaxAiExtension";
import QuestionAnswer from "@ext/markdown/elements/answer/edit/models/answer";
import DocKeyboardShortcuts from "@ext/markdown/elements/article/edit/DocKeyboardShortcuts";
import DragScroller from "@ext/markdown/elements/article/edit/DragScroller";
import BlockContentField from "@ext/markdown/elements/blockContentField/edit/models/blockField";
import BlockProperty from "@ext/markdown/elements/blockProperty/edit/models/blockProperty";
import Br from "@ext/markdown/elements/br/edit/br";
import HardBreak from "@ext/markdown/elements/br/edit/hardBreak";
import Code from "@ext/markdown/elements/code/edit/model/code";
import ExtendedCodeBlockLowlight from "@ext/markdown/elements/codeBlockLowlight/edit/model/codeBlockLowlight";
import Color from "@ext/markdown/elements/color/edit/model/color";
import CopyMsO from "@ext/markdown/elements/copyMsO/copyMsO";
import InlineCutComponent from "@ext/markdown/elements/cut/edit/model/inlineCut";
import Diagrams from "@ext/markdown/elements/diagrams/edit/models/diagrams";
import DisableMarksForInlineComponents from "@ext/markdown/elements/disableMarksForInlineComponents/disableMarksForInlineComponents";
import Drawio from "@ext/markdown/elements/drawio/edit/model/drawio";
import { Dropcursor } from "@ext/markdown/elements/dropCursor";
import Em from "@ext/markdown/elements/em/edit/em";
import File from "@ext/markdown/elements/file/edit/model/file";
import FileDropHandler from "@ext/markdown/elements/fileHandler";
import ArticleSearch from "@ext/markdown/elements/find/edit/models/ArticleSearch";
import { FloatExtension } from "@ext/markdown/elements/float/edit/model/extension";
import Fragment from "@ext/markdown/elements/fragment/edit/model/fragment";
import FragmentLink from "@ext/markdown/elements/fragment-link/edit/model/fragmentLink";
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
import NoteTitle from "@ext/markdown/elements/note/edit/model/noteTitle";
import OpenApi from "@ext/markdown/elements/openApi/edit/models/openApi";
import Paragraph from "@ext/markdown/elements/paragraph/edit/model/paragraph";
import PasteMarkdown from "@ext/markdown/elements/pasteMarkdown/pasteMarkdown";
import Question from "@ext/markdown/elements/question/edit/models/question";
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
import { EditorContextExtension } from "@ext/markdown/elementsUtils/editorContext/EditorContext";
import { Suggestion } from "@ext/StyleGuide/extension/Suggestion";
import { modifyEditorExtensions } from "@plugins/store";
import type { Extensions } from "@tiptap/core";
import Text from "@tiptap/extension-text";
import { UndoRedo } from "@tiptap/extensions";

export interface GetExtensionsPropsOptions {
	includeResources?: boolean;
	includeQuestions?: boolean;
	isTemplateInstance?: boolean;
}

const getExtensions = (options?: GetExtensionsPropsOptions): Extensions => {
	const extensions = [
		...getSimpleExtensions(),
		InlineHtmlTag,
		BlockHtmlTag,
		DocKeyboardShortcuts,
		InlineCutComponent,
		InlineMdComponent,
		BlockMd,
		VideoComponent,
		NoteComponent,
		NoteTitle,
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
		Fragment,
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
		InlineProperty.configure({
			canChangeProps: options?.isTemplateInstance,
			scope: options?.isTemplateInstance ? "article" : "catalog-view",
		}),

		...(options?.includeQuestions ? [Question, QuestionAnswer] : []),

		...(options?.includeResources ? getResourcesExtensions() : []),

		...(options?.isTemplateInstance !== undefined ? getTemplateExtensions(!options.isTemplateInstance) : []),
	];
	return modifyEditorExtensions(extensions);
};

// Base extensions for simple editor like comment editor
export const getSimpleExtensions = (): Extensions => [
	EditorContextExtension,
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
	UndoRedo,
	Typography,
	Color,
	HorizontalRule,
	Highlight,
	FragmentLink,
];

// Extensions for template editor logic
export const getTemplateExtensions = (readOnly: boolean = true): Extensions => [
	BlockContentField.configure({ editable: !readOnly }),
	BlockProperty.configure({ canChangeProps: !readOnly }),
];

// Extensions which used resource service
export const getResourcesExtensions = (): Extensions => [
	Image,
	File,
	FileDropHandler,
	Icon,
	Diagrams,
	Drawio,
	OpenApi,
	InlineImage,
];

export default getExtensions;
