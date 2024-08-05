import Br from "@ext/markdown/elements/br/edit/br";
import { Extensions } from "@tiptap/react";

import Document from "@tiptap/extension-document";
import Gapcursor from "@tiptap/extension-gapcursor";
import History from "@tiptap/extension-history";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Text from "@tiptap/extension-text";

import DocKeyboardShortcuts from "@ext/markdown/elements/article/edit/DocKeyboardShortcuts";
import HardBreak from "@ext/markdown/elements/br/edit/hardBreak";
import Code from "@ext/markdown/elements/code/edit/model/code";
import ColorHighlighter from "@ext/markdown/elements/colorHighlighter/colorHighlighter";
import Comment from "@ext/markdown/elements/comment/edit/model/comment";
import InlineCutComponent from "@ext/markdown/elements/cut/edit/model/inlineCut";
import Diagrams from "@ext/markdown/elements/diagrams/edit/models/diagrams";
import Drawio from "@ext/markdown/elements/drawio/edit/model/drawio";
import Em from "@ext/markdown/elements/em/edit/em";
import CodeBlock from "@ext/markdown/elements/fence/edit/model/codeBlock";
import File from "@ext/markdown/elements/file/edit/model/file";
import Heading from "@ext/markdown/elements/heading/edit/model/heading";
import HorizontalRule from "@ext/markdown/elements/hr/edit/horizontalRule";
import Image from "@ext/markdown/elements/image/edit/model/image";
import { joinLists } from "@ext/markdown/elements/joinLists/joinLists";
import LinkComponent from "@ext/markdown/elements/link/edit/model/link";
import BulletList from "@ext/markdown/elements/list/edit/models/bulletList/bulletList";
import ListItem from "@ext/markdown/elements/list/edit/models/listItem/model/listItem";
import OrderedList from "@ext/markdown/elements/list/edit/models/orderList/orderList";
import BlockMdComponent from "@ext/markdown/elements/md/model/blockMd";
import InlineMdComponent from "@ext/markdown/elements/md/model/inlineMd";
import ArrowsMove from "@ext/markdown/elements/moveNode/model/ArrowsMove";
import NoteComponent from "@ext/markdown/elements/note/edit/model/note";
import OpenApi from "@ext/markdown/elements/openApi/edit/models/openApi";
import Paragraph from "@ext/markdown/elements/paragraph/edit/model/paragraph";
import Placeholder from "@ext/markdown/elements/placeholder/placeholder";
import Strike from "@ext/markdown/elements/strikethrough/edit/strike";
import Strong from "@ext/markdown/elements/strong/edit/strong";
import StyleWrapper from "@ext/markdown/elements/styleWrapper/model/styleWrapper";
import TableKeyboardShortcuts from "@ext/markdown/elements/table/edit/model/TableKeyboardShortcuts";
import Tab from "@ext/markdown/elements/tabs/edit/model/tab/tab";
import Tabs from "@ext/markdown/elements/tabs/edit/model/tabs/tabs";
import Typography from "@ext/markdown/elements/typography/typography";
import VideoComponent from "@ext/markdown/elements/video/edit/model/video";
import SmileReplacer from "../../../elements/smilieReplacer/smileReplacer";
import Snippet from "@ext/markdown/elements/snippet/edit/model/snippet";
import CopyArticles from "@ext/markdown/elements/copyArticles/copyArticles";
import Icon from "@ext/markdown/elements/icon/edit/model/icon";
import CustomTable from "@ext/markdown/elements/table/edit/model/customTable";

const getExtensions = (): Extensions => [
	DocKeyboardShortcuts,
	InlineCutComponent,
	InlineMdComponent,
	BlockMdComponent,
	VideoComponent,
	HorizontalRule,
	NoteComponent,
	LinkComponent,
	StyleWrapper,
	Placeholder,
	ArrowsMove,
	joinLists,
	CodeBlock,
	Gapcursor,
	Diagrams,
	OpenApi,
	Drawio,
	Image,
	File,
	Icon,
	Tabs,
	Tab,

	Br,

	Snippet,
	TableRow,
	TableCell,
	TableHeader,
	TableKeyboardShortcuts,
	CustomTable,

	...getSimpleExtensions(),
	Document.extend({
		content: "heading block+",
	}),
];

export const getSimpleExtensions = (): Extensions => [
	ColorHighlighter,
	CopyArticles,
	SmileReplacer,
	Typography,
	Paragraph,
	Document,
	History,
	Heading,
	Strong,
	Strike,
	Code,
	Text,
	Em,

	HardBreak,

	OrderedList,
	BulletList,
	ListItem,

	Comment,
];

export default getExtensions;
