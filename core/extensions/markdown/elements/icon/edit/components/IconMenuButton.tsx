import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import {
	IconPicker,
	type IconPickerColor,
	type OnChangeCallback,
} from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPicker";
import type { Editor } from "@tiptap/core";
import { DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { memo, useCallback } from "react";

interface IconMenuButtonProps {
	editor: Editor;
}

const IconMenuButton = ({ editor }: IconMenuButtonProps) => {
	const { disabled } = ButtonStateService.useCurrentAction({ action: "icon" });

	const insertCustomIcon = useCallback(
		(code: string, svg: string) => {
			editor.chain().setIcon({ code, svg }).run();
		},
		[editor],
	);

	const insertLucideIcon = useCallback(
		(labelField: string, color?: IconPickerColor) => {
			editor.chain().setIcon({ code: labelField, color }).run();
		},
		[editor],
	);

	const handleIconChange = useCallback(
		(code: string, svg: string, color?: IconPickerColor) => {
			if (svg) {
				insertCustomIcon(code, svg);
			} else {
				insertLucideIcon(code, color);
			}
		},
		[insertCustomIcon, insertLucideIcon],
	);

	const handleEmojiChange = useCallback(
		(emoji: string) => {
			editor.chain().insertContent(emoji).run();
		},
		[editor],
	);

	const handleChange: OnChangeCallback = useCallback(
		(props) => {
			if ("code" in props) {
				handleIconChange(props.code, props.svg, props.color);
			} else if ("emoji" in props) {
				handleEmojiChange(props.emoji);
			}
		},
		[handleIconChange, handleEmojiChange],
	);

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger disabled={disabled}>
				<div className="flex flex-row items-center gap-2 w-full">
					<Icon icon="smile" />
					{t("icon")}
				</div>
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent className="shadow-hard-base p-0 min-w-32" sideOffset={8}>
				<IconPicker className="max-h-96" disable={["file-input"]} onChange={handleChange} size="sm" />
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

export default memo(IconMenuButton);
