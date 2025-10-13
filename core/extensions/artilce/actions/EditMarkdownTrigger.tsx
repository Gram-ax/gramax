import Icon from "@components/Atoms/Icon";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { ComponentProps } from "react";
import EditMarkdown from "./EditMarkdown";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";

interface EditMarkdownTriggerProps {
	disabled?: boolean;
	loadContent: () => Promise<string>;
	saveContent: (content: string) => Promise<void>;
}

const EditMarkdownTrigger = ({ loadContent, saveContent, disabled }: EditMarkdownTriggerProps) => {
	const onSelect = () => {
		ModalToOpenService.setValue<ComponentProps<typeof EditMarkdown>>(ModalToOpen.MarkdownEditor, {
			loadContent,
			saveContent,
			onClose: () => {
				ModalToOpenService.resetValue();
			},
		});
	};

	return (
		<DropdownMenuItem onSelect={onSelect} disabled={disabled}>
			<Icon code="file-pen" />
			{t("article.edit-markdown")}
		</DropdownMenuItem>
	);
};

export default EditMarkdownTrigger;
