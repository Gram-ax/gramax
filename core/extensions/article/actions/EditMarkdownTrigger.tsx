import Icon from "@components/Atoms/Icon";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { ComponentProps } from "react";
import EditMarkdown from "./EditMarkdown";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { cn } from "@core-ui/utils/cn";

interface EditMarkdownTriggerProps {
	disabled?: boolean;
	disabledTooltip?: string;
	loadContent: () => Promise<string>;
	saveContent: (content: string) => Promise<void>;
}

const EditMarkdownTrigger = ({ loadContent, saveContent, disabled, disabledTooltip }: EditMarkdownTriggerProps) => {
	const onSelect = () => {
		ModalToOpenService.setValue<ComponentProps<typeof EditMarkdown>>(ModalToOpen.MarkdownEditor, {
			loadContent,
			saveContent,
			onClose: () => {
				ModalToOpenService.resetValue();
			},
		});
	};
	const item = (
		<DropdownMenuItem onSelect={onSelect} disabled={disabled}>
			<Icon code="file-pen" />
			{t("article.edit-markdown")}
		</DropdownMenuItem>
	);

	if (!disabled) return item;

	return (
		<Tooltip>
			<TooltipTrigger className={cn(disabled && "cursor-default")}>{item}</TooltipTrigger>
			<TooltipContent>{disabledTooltip}</TooltipContent>
		</Tooltip>
	);
};

export default EditMarkdownTrigger;
