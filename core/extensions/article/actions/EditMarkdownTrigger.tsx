import Icon from "@components/Atoms/Icon";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { ComponentProps } from "react";
import EditMarkdown from "./EditMarkdown";

interface EditMarkdownTriggerProps {
	loadContent: () => Promise<string>;
	saveContent: (content: string) => Promise<void>;
	isCurrentItem: boolean;
	isTemplate: boolean;
	disabled?: boolean;
}

const getDisabledMarkdownInfo = (isTemplate: boolean, isCurrentItem: boolean) => {
	if (!isCurrentItem) {
		return { disabled: true, disabledTooltip: t("article.edit-markdown-disabled-not-current-item") };
	}
	if (isTemplate) return { disabled: true, disabledTooltip: t("article.edit-markdown-disabled-template") };

	return { disabled: false, disabledTooltip: undefined };
};

const EditMarkdownTrigger = ({ loadContent, saveContent, isCurrentItem, isTemplate }: EditMarkdownTriggerProps) => {
	const onSelect = () => {
		ModalToOpenService.setValue<ComponentProps<typeof EditMarkdown>>(ModalToOpen.MarkdownEditor, {
			loadContent,
			saveContent,
			onClose: () => {
				ModalToOpenService.resetValue();
			},
		});
	};

	const { disabled, disabledTooltip } = getDisabledMarkdownInfo(isTemplate, isCurrentItem);

	const dropdownItem = (
		<DropdownMenuItem disabled={disabled} onSelect={onSelect}>
			<Icon code="file-pen" />
			{t("article.edit-markdown")}
		</DropdownMenuItem>
	);

	if (!disabled) return dropdownItem;

	return (
		<Tooltip>
			<TooltipTrigger className={cn(disabled && "cursor-default")}>{dropdownItem}</TooltipTrigger>
			<TooltipContent>{disabledTooltip}</TooltipContent>
		</Tooltip>
	);
};

export default EditMarkdownTrigger;
