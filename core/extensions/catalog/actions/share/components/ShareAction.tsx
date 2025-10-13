import Icon from "@components/Atoms/Icon";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { showPopover } from "@core-ui/showPopover";
import { useRouter } from "@core/Api/useRouter";
import { getClientDomain } from "@core/utils/getClientDomain";
import ShareModal from "@ext/catalog/actions/share/components/ShareModal";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { ComponentProps, useCallback, useMemo } from "react";

const SHARE_SKIP_MODAL = "share.skip";

interface ShareActionProps {
	path: string;
	isArticle: boolean;
}

const shouldShowShareModal = () => {
	if (typeof window === "undefined") return false;
	return !window.localStorage.getItem(SHARE_SKIP_MODAL);
};

const setShareSkipModal = (flag: boolean) => {
	if (typeof window === "undefined") return;
	flag ? window.localStorage.setItem(SHARE_SKIP_MODAL, "1") : window.localStorage.removeItem(SHARE_SKIP_MODAL);
};

const ShareAction = ({ path, isArticle }: ShareActionProps) => {
	const router = useRouter();
	const shouldShowModal = useMemo(() => {
		return shouldShowShareModal();
	}, []);

	const shareUrl = useMemo(() => {
		let newPath = path || router.path;
		newPath = newPath.startsWith("/") ? newPath : `/${newPath}`;
		return `${getClientDomain()}${newPath}`;
	}, [path]);

	const onClick = useCallback(() => {
		try {
			void navigator.clipboard.writeText(shareUrl);
			showPopover(`${t("share.popover")}`);
		} catch (error) {
			showPopover("Failed to copy link");
		}
	}, [isArticle, shareUrl]);

	const openModal = () => {
		ModalToOpenService.setValue<ComponentProps<typeof ShareModal>>(ModalToOpen.Share, {
			path,
			shareUrl,
			setShouldSkipModal: setShareSkipModal,
			isArticle,
			onCopy: onClick,
			onClose: () => {
				ModalToOpenService.resetValue();
			},
		});
	};

	const onClickButton = () => {
		if (shouldShowModal) return openModal();
		onClick();
	};

	return (
		<DropdownMenuItem onSelect={onClickButton}>
			<Icon code="link" />
			{isArticle ? t("share.name.article") : t("share.name.catalog")}
		</DropdownMenuItem>
	);
};

export default ShareAction;
