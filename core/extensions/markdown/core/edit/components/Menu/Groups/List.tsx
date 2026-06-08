import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { getEditorStore } from "@core-ui/stores/EditorStore";
import t from "@ext/localization/locale/translate";
import BulletListMenuButton from "@ext/markdown/elements/list/edit/models/bulletList/components/BulletListMenuButton";
import OrderedListMenuButton from "@ext/markdown/elements/list/edit/models/orderList/components/OrderedListMenuButton";
import TaskListMenuButton from "@ext/markdown/elements/list/edit/models/taskList/components/TaskListMenuButton";
import type { Editor } from "@tiptap/core";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import { ToolbarIcon, ToolbarSeparator, ToolbarToggleButton, ToolbarTriggerChevron } from "@ui-kit/Toolbar";
import { useCallback, useMemo } from "react";

export interface ListMenuGroupButtons {
	bulletList?: boolean;
	orderedList?: boolean;
	taskList?: boolean;
}

interface ListMenuGroupProps {
	editor?: Editor;
	buttons?: ListMenuGroupButtons;
}

const ListMenuGroup = ({ editor, buttons }: ListMenuGroupProps) => {
	const { bulletList = true, orderedList = true, taskList = true } = buttons || {};

	const bulletListState = ButtonStateService.useCurrentAction({ action: "bulletList" });
	const orderedListState = ButtonStateService.useCurrentAction({ action: "orderedList" });
	const taskListState = ButtonStateService.useCurrentAction({ action: "taskList" });

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const value = useMemo(() => {
		if (editor?.isActive("bulletList")) return "bullet";
		if (editor?.isActive("orderedList")) return "ordered";
		if (editor?.isActive("taskList")) return "task";
		return getEditorStore().lastUsedListType || "bullet";
	}, [editor?.state.selection]);

	const onSelectList = useCallback(
		(type: "bullet" | "ordered" | "task") => {
			if (!editor) return;
			if (type === "bullet") editor.chain().focus().toggleBulletList().run();
			else if (type === "ordered") editor.chain().focus().toggleOrderedList().run();
			else if (type === "task") editor.chain().focus().toggleTaskList().run();
		},
		[editor],
	);

	const onCloseAutoFocus = useCallback(
		(event: Event) => {
			event.preventDefault();
			editor?.commands.focus();
		},
		[editor],
	);

	const { disabled, active, tooltip, icon, hotKey } = useMemo(() => {
		return {
			disabled: bulletListState.disabled && orderedListState.disabled && taskListState.disabled,
			active:
				value === "bullet"
					? bulletListState.isActive
					: value === "ordered"
						? orderedListState.isActive
						: taskListState.isActive,
			tooltip:
				value === "bullet"
					? t("editor.bullet-list")
					: value === "ordered"
						? t("editor.ordered-list")
						: t("editor.task-list"),
			icon: value === "bullet" ? "list" : value === "ordered" ? "list-ordered" : "list-todo",
			hotKey: value === "bullet" ? "Mod-Shift-8" : value === "ordered" ? "Mod-Shift-7" : "Mod-Shift-9",
		};
	}, [
		bulletListState.disabled,
		bulletListState.isActive,
		orderedListState.disabled,
		orderedListState.isActive,
		taskListState.disabled,
		taskListState.isActive,
		value,
	]);

	return (
		<>
			{(bulletList || orderedList || taskList) && <ToolbarSeparator />}
			<ToolbarToggleButton
				active={active}
				data-testid={`tb-${value}-list`}
				disabled={disabled}
				hotKey={hotKey}
				onClick={() => onSelectList(value)}
				tooltipText={tooltip}
			>
				<ToolbarIcon icon={icon as IconCode} />
			</ToolbarToggleButton>
			<ComponentVariantProvider variant="inverse">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<ToolbarTriggerChevron data-testid="tb-lists" disabled={disabled} sub />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="lg:shadow-hard-base"
						onCloseAutoFocus={onCloseAutoFocus}
						side="top"
						sideOffset={8}
					>
						<DropdownMenuLabel className="font-normal text-inverse-muted">
							{t("editor.lists")}
						</DropdownMenuLabel>
						{bulletList && (
							<BulletListMenuButton
								active={bulletListState.isActive}
								disabled={bulletListState.disabled}
								editor={editor}
							/>
						)}
						{orderedList && (
							<OrderedListMenuButton
								active={orderedListState.isActive}
								disabled={orderedListState.disabled}
								editor={editor}
							/>
						)}
						{taskList && (
							<TaskListMenuButton
								active={taskListState.isActive}
								disabled={taskListState.disabled}
								editor={editor}
							/>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</ComponentVariantProvider>
		</>
	);
};

export default ListMenuGroup;
