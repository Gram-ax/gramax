import Icon from "@components/Atoms/Icon";
import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import type Modal from "@ext/git/actions/History/component/History";
import t from "@ext/localization/locale/translate";
import useHasRemoteStorage from "@ext/storage/logic/utils/useHasRemoteStorage";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import type { ComponentProps } from "react";
import useIsFileNew from "../../../../../components/Actions/useIsFileNew";

interface HistoryProps {
	item: ClientArticleProps;
}

const HistoryTrigger = (props: HistoryProps) => {
	const { item } = props;

	const hasRemoteStorage = useHasRemoteStorage();
	const isFileNew = useIsFileNew(item);
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
