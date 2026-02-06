import { cn } from "@core-ui/utils/cn";
import { cssMedia } from "@core-ui/utils/cssUtils";
import TranscribeButton from "@ext/ai/components/Audio/Buttons/TranscribeMenuButton";
import AIGroup from "@ext/markdown/core/edit/components/Menu/Groups/AIGroup";
import PropertyMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Property";
import ToolbarWrapper from "@ext/markdown/core/edit/components/Menu/ToolbarWrapper";
import InlineEditPanel from "@ext/markdown/elements/article/edit/helpers/InlineEditPanel";
import { InlineToolbarOptions } from "@ext/markdown/elements/article/edit/helpers/InlineToolbar";
import { LinkMenuMobilePopover } from "@ext/markdown/elements/link/edit/components/LinkMenu/LinkMenuMobilePopover";
import getSelectedText from "@ext/markdown/elementsUtils/getSelectedText";
import { useMediaQuery } from "@mui/material";
import { Editor } from "@tiptap/core";
import { Toolbar, ToolbarSeparator } from "@ui-kit/Toolbar";
import { CellSelection, isInTable } from "prosemirror-tables";
import { memo, useEffect, useState } from "react";
import AnyMenuGroup from "../Groups/Any";
import HeadersMenuGroup from "../Groups/Headers";
import ListMenuGroup from "../Groups/List";
import TextMenuGroup from "../Groups/Text";

export interface ToolbarMenuProps {
	includeResources?: boolean;
	isGramaxAiEnabled?: boolean;
	isTemplate?: boolean;
	fileName?: string;
	isSmallEditor?: boolean;
	isMobile?: boolean;
}

interface MainToolbarMenuProps extends ToolbarMenuProps {
	editor?: Editor;
}

type ToolbarButtonsVariant = "inline" | "main";
const MainToolbarButtons = (props: MainToolbarMenuProps) => {
	const { editor, includeResources = true, isTemplate, fileName, isSmallEditor, isGramaxAiEnabled, isMobile } = props;

	return (
		<Toolbar role="article-toolbar">
			<HeadersMenuGroup editor={editor} />
			<ToolbarSeparator />
			<TextMenuGroup editor={editor} />
			{isTemplate && (
				<>
					<ToolbarSeparator />
					<PropertyMenuGroup editor={editor} />
				</>
			)}
			{!isMobile && <ToolbarSeparator />}
			<ListMenuGroup editor={editor} />
			<ToolbarSeparator />
			<AnyMenuGroup
				editor={editor}
				fileName={fileName}
				includeResources={includeResources}
				isSmallEditor={isSmallEditor}
			/>
			<ToolbarSeparator />
			<TranscribeButton editor={editor} />
			{isGramaxAiEnabled && (
				<>
					<AIGroup editor={editor} />
				</>
			)}
		</Toolbar>
	);
};

const InlineToolbarButtons = (props: MainToolbarMenuProps) => {
	const { editor } = props;

	const [options, setOptions] = useState<InlineToolbarOptions>({
		isInTable: false,
		isCellSelection: false,
	});

	useEffect(() => {
		if (!editor) return;

		const onSelectionUpdate = ({ editor }: { editor: Editor }) => {
			const inTable = isInTable(editor.state);
			const isCellSelection = editor.state.selection instanceof CellSelection;

			setOptions({
				isInTable: inTable,
				isCellSelection,
			});
		};

		editor.on("selectionUpdate", onSelectionUpdate);
		return () => {
			editor.off("selectionUpdate", onSelectionUpdate);
		};
	}, [editor]);

	return (
		<InlineEditPanel
			closeHandler={() => {}}
			editor={editor}
			isCellSelection={options.isCellSelection}
			isInTable={options.isInTable}
		/>
	);
};

const ToolbarMenu = (props: MainToolbarMenuProps) => {
	const { editor, includeResources = true, isGramaxAiEnabled, isTemplate, fileName, isSmallEditor = false } = props;
	const isMobile = useMediaQuery(cssMedia.JSnarrow);

	const [variant, setVariant] = useState<ToolbarButtonsVariant>("main");

	useEffect(() => {
		if (!editor || !isMobile) return;

		const onSelectionUpdate = ({ editor }: { editor: Editor }) => {
			const empty = editor.state.selection.empty && !getSelectedText(editor.state).length;
			setVariant(!empty ? "inline" : "main");
		};

		editor.on("selectionUpdate", onSelectionUpdate);
		return () => {
			setVariant("main");
			editor.off("selectionUpdate", onSelectionUpdate);
		};
	}, [editor, isMobile]);

	const Component = variant === "main" ? MainToolbarButtons : InlineToolbarButtons;

	return (
		<>
			<ToolbarWrapper className={cn("transition-all", !isMobile && "lg:shadow-hard-base rounded-lg")}>
				<Component
					editor={editor}
					fileName={fileName}
					includeResources={includeResources}
					isGramaxAiEnabled={isGramaxAiEnabled}
					isMobile={isMobile}
					isSmallEditor={isSmallEditor}
					isTemplate={isTemplate}
				/>
			</ToolbarWrapper>
			{isMobile && <LinkMenuMobilePopover editor={editor} />}
		</>
	);
};
export default memo(ToolbarMenu);
