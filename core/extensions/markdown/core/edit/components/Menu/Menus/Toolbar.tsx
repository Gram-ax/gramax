import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import useMediaQuery from "@core-ui/hooks/useMediaQuery";
import { cn } from "@core-ui/utils/cn";
import { cssMedia } from "@core-ui/utils/cssUtils";
import TranscribeButton from "@ext/ai/components/Audio/Buttons/TranscribeMenuButton";
import { useIsRevision } from "@ext/git/actions/Revisions/logic/hooks/useIsRevision";
import { ToolbarDiffToggle } from "@ext/git/core/Diff/components/ToolbarDiffToggle";
import { ToolbarMarkdownModeToggle } from "@ext/git/core/Diff/components/ToolbarMarkdownModeToggle";
import { useIsDiffView } from "@ext/git/core/Diff/logic/hooks/useIsDiffView";
import t from "@ext/localization/locale/translate";
import AIGroup from "@ext/markdown/core/edit/components/Menu/Groups/AIGroup";
import { useToolbarMode } from "@ext/markdown/core/edit/logic/Toolbar/useToolbarMode";
import InlineEditPanel from "@ext/markdown/elements/article/edit/helpers/InlineEditPanel";
import type { InlineToolbarOptions } from "@ext/markdown/elements/article/edit/helpers/InlineToolbar";
import { LinkMenuMobilePopover } from "@ext/markdown/elements/link/edit/components/LinkMenu/LinkMenuMobilePopover";
import getSelectedText from "@ext/markdown/elementsUtils/getSelectedText";
import { ToolbarToggleReview } from "@ext/review/components/Toolbar/ToolbarToggleReview";
import type { Editor } from "@tiptap/core";
import { Toolbar, ToolbarSeparator } from "@ui-kit/Toolbar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
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
	isDefaultMode?: boolean;
}

type ToolbarButtonsVariant = "inline" | "main";
const MainToolbarButtons = (props: MainToolbarMenuProps) => {
	const { editor, includeResources = true, fileName, isSmallEditor, isGramaxAiEnabled, isDefaultMode } = props;

	return (
		<Toolbar className="md:rounded-lg" data-qa="qa-edit-menu-button" data-testid="editor-toolbar">
			<div
				className={cn(
					"contents",
					!isDefaultMode &&
						"[&>div]:opacity-50 [&>button]:opacity-50 [&>div]:pointer-events-none [&>button]:pointer-events-none",
				)}
				data-toolbar-modes="default"
			>
				<HeadersMenuGroup editor={editor} />
				<ToolbarSeparator />
				<TextMenuGroup editor={editor} />
				<ListMenuGroup editor={editor} />
				<ToolbarSeparator />
				<AnyMenuGroup
					editor={editor}
					fileName={fileName}
					includeResources={includeResources}
					isSmallEditor={isSmallEditor}
				/>
				{isGramaxAiEnabled && (
					<>
						<ToolbarSeparator />
						<TranscribeButton editor={editor} />
						<AIGroup editor={editor} />
					</>
				)}
			</div>
			{!isSmallEditor && (
				<>
					<ToolbarSeparator />
					<ToolbarMarkdownModeToggle />
					<ToolbarToggleReview />
					<ToolbarDiffToggle />
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
	const isDefaultMode = useToolbarMode();
	const isReadOnly = PageDataContext?.value?.conf?.isReadOnly;
	const isRevision = useIsRevision();
	const [variant, setVariant] = useState<ToolbarButtonsVariant>("main");

	useEffect(() => {
		if (!editor || !isMobile || isReadOnly) return;

		const onSelectionUpdate = ({ editor }: { editor: Editor }) => {
			const empty = editor.state.selection.empty && !getSelectedText(editor.state).length;
			setVariant(!empty ? "inline" : "main");
		};

		editor.on("selectionUpdate", onSelectionUpdate);
		return () => {
			setVariant("main");
			editor.off("selectionUpdate", onSelectionUpdate);
		};
	}, [editor, isMobile, isReadOnly]);

	const Component = variant === "main" ? MainToolbarButtons : InlineToolbarButtons;

	const Content = (
		<>
			<Component
				editor={editor}
				fileName={fileName}
				includeResources={includeResources}
				isDefaultMode={isDefaultMode}
				isGramaxAiEnabled={isGramaxAiEnabled}
				isMobile={isMobile}
				isSmallEditor={isSmallEditor}
				isTemplate={isTemplate}
			/>
			{isMobile && editor && <LinkMenuMobilePopover editor={editor} />}
		</>
	);

	const isDiffView = useIsDiffView();

	if ((isReadOnly && !isDiffView) || isRevision)
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<div className={isDiffView || isRevision ? undefined : "[&>div]:pointer-events-none"}>
						{Content}
					</div>
				</TooltipTrigger>
				<TooltipContent>{t("editor.at-revision")}</TooltipContent>
			</Tooltip>
		);

	return Content;
};
export default memo(ToolbarMenu);
