import Br from "@ext/markdown/elements/br/edit/br";
import ExtendedCodeBlockLowlight from "@ext/markdown/elements/codeBlockLowlight/edit/model/codeBlockLowlight";
import ArticleSearch from "@ext/markdown/elements/find/edit/models/ArticleSearch";
import { Extensions } from "@tiptap/react";

import Document from "@tiptap/extension-document";
import History from "@tiptap/extension-history";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Text from "@tiptap/extension-text";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import TaskList from "@tiptap/extension-task-list";

import DocKeyboardShortcuts from "@ext/markdown/elements/article/edit/DocKeyboardShortcuts";
import DragScroller from "@ext/markdown/elements/article/edit/DragScroller";
import HardBreak from "@ext/markdown/elements/br/edit/hardBreak";
import Code from "@ext/markdown/elements/code/edit/model/code";
import ColorHighlighter from "@ext/markdown/elements/colorHighlighter/colorHighlighter";
import Comment from "@ext/markdown/elements/comment/edit/model/comment";
import CopyMsO from "@ext/markdown/elements/copyMsO/copyMsO";
import InlineCutComponent from "@ext/markdown/elements/cut/edit/model/inlineCut";
import Diagrams from "@ext/markdown/elements/diagrams/edit/models/diagrams";
import Drawio from "@ext/markdown/elements/drawio/edit/model/drawio";
import { Dropcursor } from "@ext/markdown/elements/dropCursor";
import Em from "@ext/markdown/elements/em/edit/em";
import File from "@ext/markdown/elements/file/edit/model/file";
import Heading from "@ext/markdown/elements/heading/edit/model/heading";
import HorizontalRule from "@ext/markdown/elements/hr/edit/horizontalRule";
import Html from "@ext/markdown/elements/html/edit/models/html";
import Icon from "@ext/markdown/elements/icon/edit/model/icon";
import Image from "@ext/markdown/elements/image/edit/model/image";
import { joinLists } from "@ext/markdown/elements/joinLists/joinLists";
import LinkComponent from "@ext/markdown/elements/link/edit/model/link";
import BlockMdComponent from "@ext/markdown/elements/md/model/blockMd";
import InlineMdComponent from "@ext/markdown/elements/md/model/inlineMd";
import ArrowsMove from "@ext/markdown/elements/moveNode/model/ArrowsMove";
import NoteComponent from "@ext/markdown/elements/note/edit/model/note";
import OpenApi from "@ext/markdown/elements/openApi/edit/models/openApi";
import Paragraph from "@ext/markdown/elements/paragraph/edit/model/paragraph";
import Placeholder from "@ext/markdown/elements/placeholder/placeholder";
import Snippet from "@ext/markdown/elements/snippet/edit/model/snippet";
import Strike from "@ext/markdown/elements/strikethrough/edit/strike";
import Strong from "@ext/markdown/elements/strong/edit/strong";
import CustomTable from "@ext/markdown/elements/table/edit/model/customTable";
import TableKeyboardShortcuts from "@ext/markdown/elements/table/edit/model/TableKeyboardShortcuts";
import Tab from "@ext/markdown/elements/tabs/edit/model/tab/tab";
import Tabs from "@ext/markdown/elements/tabs/edit/model/tabs/tabs";
import Typography from "@ext/markdown/elements/typography/typography";
import UnsupportedComponent from "@ext/markdown/elements/unsupported/edit/model/unsupported";
import VideoComponent from "@ext/markdown/elements/video/edit/model/video";
import View from "@ext/markdown/elements/view/edit/models/view";
import { Suggestion } from "@ext/StyleGuide/extension/Suggestion";
import SmileReplacer from "../../../elements/smilieReplacer/smileReplacer";
import LineBreakers from "@ext/markdown/elements/lineBreakers/lineBreakers";
import customTaskItem from "@ext/markdown/elements/list/edit/models/taskItem/model/taskItem";

const getExtensions = (): Extensions => [
	DocKeyboardShortcuts,
	InlineCutComponent,
	InlineMdComponent,
	BlockMdComponent,
	VideoComponent,
	HorizontalRule,
	NoteComponent,
	ArticleSearch,
	UnsupportedComponent,
	LinkComponent,
	Placeholder,
	ArrowsMove,
	joinLists,
	ExtendedCodeBlockLowlight,
	DragScroller,
	Dropcursor,
	Diagrams,
	OpenApi,
	Drawio,
	Image,
	File,
	Icon,
	Tabs,
	Tab,
	Suggestion,

	Br,

	Snippet,
	TableRow,
	TableCell,
	TableHeader,
	TableKeyboardShortcuts,
	CustomTable,

	...getSimpleExtensions(),
	Document.extend({
		content: "paragraph block+",
	}),
];

export const getSimpleExtensions = (): Extensions => [
	ColorHighlighter,
	LineBreakers,
	CopyMsO,
	SmileReplacer,
	Typography,
	Paragraph,
	Document,
	History,
	Heading,
	Strong,
	Strike,
	Code,
	Html,
	View,
	Text,
	Em,

	HardBreak,

	OrderedList,
	BulletList,
	TaskList,
	ListItem,
	customTaskItem,

	Comment,
];

export default getExtensions;
