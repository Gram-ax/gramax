import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import { useRouter } from "@core/Api/useRouter";
import { getClientDomain } from "@core/utils/getClientDomain";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { tryCopyToClipboard } from "@core-ui/utils/clipboard";
import type ShareModal from "@ext/catalog/actions/share/components/ShareModal";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { type ComponentProps, type ReactNode, useCallback, useMemo } from "react";

const SHARE_SKIP_MODAL = "share.skip";

interface ShareActionProps {
	path: string;
	isArticle: boolean;
	children?: ReactNode;
	variant?: "MenuItem" | "Button";
}

const shouldShowShareModal = () => {
	if (typeof window === "undefined") return false;
	return !window.localStorage.getItem(SHARE_SKIP_MODAL);
};

const setShareSkipModal = (flag: boolean) => {
	if (typeof window === "undefined") return;
	flag ? window.localStorage.setItem(SHARE_SKIP_MODAL, "1") : window.localStorage.removeItem(SHARE_SKIP_MODAL);
};

const ShareAction = ({ path, isArticle, children, variant = "MenuItem" }: ShareActionProps) => {
	const router = useRouter();
	const webEditorUrl = WorkspaceService.current()?.webEditorUrl;
	const shouldShowModal = useMemo(() => {
		return shouldShowShareModal();
	}, []);

	const shareUrl = useMemo(() => {
		let newPath = path || router.path;
		newPath = newPath.startsWith("/") ? newPath : `/${newPath}`;
		return `${getClientDomain(webEditorUrl)}${newPath}`;
	}, [webEditorUrl, path, router.path]);

	const onClick = useCallback(() => {
		void tryCopyToClipboard(shareUrl);
	}, [shareUrl]);

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

	if (variant === "Button") {
		return (
			<Button className="p-0 h-full" onClick={onClickButton} size="xs" variant="text">
				<Icon code="link" />
				{isArticle ? t("share.name.article") : t("share.name.catalog")}
			</Button>
		);
	}

	return (
		<CatalogItem
			renderLabel={(Component) => (
				<Component onSelect={onClickButton}>
					<Icon code="link" />
					{isArticle ? t("share.name.article") : t("share.name.catalog")}
				</Component>
			)}
		>
			{children}
		</CatalogItem>
	);
};

export default ShareAction;
