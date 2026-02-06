import Icon from "@components/Atoms/Icon";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import Modal from "@ext/git/actions/History/component/History";
import t from "@ext/localization/locale/translate";
import useHasRemoteStorage from "@ext/storage/logic/utils/useHasRemoteStorage";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { ComponentProps } from "react";

interface HistoryProps {
	item: ClientArticleProps;
	isFileNew: boolean;
}

const HistoryTrigger = (props: HistoryProps) => {
	const { isFileNew, item } = props;

	const hasRemoteStorage = useHasRemoteStorage();
	const disabled = !hasRemoteStorage || isFileNew;

	const onClick = () => {
		ModalToOpenService.setValue<ComponentProps<typeof Modal>>(ModalToOpen.History, {
			item,
			onClose: () => {
				ModalToOpenService.resetValue();
			},
		});
	};

	return (
		<DropdownMenuItem disabled={disabled} onSelect={onClick}>
			<Icon code="history" />
			{t("git.history.button")}
		</DropdownMenuItem>
	);
};

export default HistoryTrigger;
