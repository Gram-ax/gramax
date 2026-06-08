import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { getEditorStore, setEditorStore } from "@core-ui/stores/EditorStore";
import t from "@ext/localization/locale/translate";
import HeadingMenuButton from "@ext/markdown/elements/heading/edit/components/HeadingMenuButton";
import type { Level } from "@ext/markdown/elements/heading/edit/model/heading";
import type { Editor } from "@tiptap/core";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import { ToolbarDropdownMenuItem, ToolbarToggleGroup, ToolbarTriggerChevron } from "@ui-kit/Toolbar";
import { useCallback } from "react";

const HeadersMenuGroup = ({ editor }: { editor?: Editor }) => {
	const { disabled, isActive, attrs } = ButtonStateService.useCurrentAction({
		action: "heading",
	});

	const onSelectHeading = useCallback(
		(level: Level) => {
			if (!editor) return;
			editor.chain().focus().toggleHeading({ level }).run();
			setEditorStore({ lastUsedHeadingLevel: level });
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

	const lastUsedHeadingLevel = isActive ? attrs?.level : getEditorStore().lastUsedHeadingLevel || 2;
	const lastUsedHeadingLevelString = lastUsedHeadingLevel?.toString();

	return (
		<>
			<ToolbarToggleGroup
				defaultValue={lastUsedHeadingLevelString}
				disabled={disabled}
				type="single"
				value={lastUsedHeadingLevelString}
			>
				<HeadingMenuButton editor={editor} level={lastUsedHeadingLevel} />
			</ToolbarToggleGroup>
			<ComponentVariantProvider variant="inverse">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<ToolbarTriggerChevron data-testid="tb-headers" disabled={disabled} sub />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="lg:shadow-hard-base"
						onCloseAutoFocus={onCloseAutoFocus}
						side="top"
						sideOffset={8}
					>
						<DropdownMenuLabel className="font-normal text-inverse-muted">
							{t("editor.heading")}
						</DropdownMenuLabel>
						{[2, 3, 4].map((level) => (
							<ToolbarDropdownMenuItem
								active={lastUsedHeadingLevelString === level.toString()}
								key={level}
								onSelect={() => onSelectHeading(level as Level)}
							>
								<Icon icon={`heading-${level}-custom` as IconCode} />
								{t("editor.heading")} {level} <DropdownMenuShortcut value={`Mod-Alt-${level}`} />
							</ToolbarDropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</ComponentVariantProvider>
		</>
	);
};

export default HeadersMenuGroup;
