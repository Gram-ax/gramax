import InlineMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Inline";
import ListMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/List";
import TableMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Table";
import TableAggregation from "@ext/markdown/core/edit/components/Menu/Groups/TableAggregation";
import TextMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Text";
import { InlineToolbarOptions } from "@ext/markdown/elements/article/edit/helpers/InlineToolbar";
import { Editor } from "@tiptap/core";
import { Toolbar, ToolbarSeparator } from "@ui-kit/Toolbar";
import { memo } from "react";

interface InlineEditPanelProps extends InlineToolbarOptions {
	editor: Editor;
	closeHandler: () => void;
}

const InlineEditPanel = memo((props: InlineEditPanelProps) => {
	const { editor, closeHandler, isInTable, isCellSelection } = props;

	return (
		<Toolbar data-qa="qa-inline-wysiwyg-menu" role="article-inline-toolbar">
			{isInTable && (
				<>
					<TableMenuGroup editor={editor} onClick={closeHandler} />
					<TableAggregation disabled={!isCellSelection} editor={editor} />
					<ToolbarSeparator />
				</>
			)}
			<TextMenuGroup editor={editor} isSelectionMenu />
			<ListMenuGroup editor={editor} />
			{!isCellSelection && (
				<>
					<ToolbarSeparator />
					<InlineMenuGroup editor={editor} onClick={closeHandler} />
				</>
			)}
		</Toolbar>
	);
});

export default InlineEditPanel;
