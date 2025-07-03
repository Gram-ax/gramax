import ButtonLink from "@components/Molecules/ButtonLink";
import { showPopover } from "@core-ui/showPopover";
import { useRouter } from "@core/Api/useRouter";
import { getClientDomain } from "@core/utils/getClientDomain";
import ShareModal from "@ext/catalog/actions/share/components/ShareModal";
import t from "@ext/localization/locale/translate";
import { MouseEvent, useCallback, useMemo, useState } from "react";

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
	const [isOpen, setIsOpen] = useState(false);
	const router = useRouter();

	const shareUrl = useMemo(() => {
		let newPath = path || router.path;
		newPath = newPath.startsWith("/") ? newPath : `/${newPath}`;
		return `${getClientDomain()}${newPath}`;
	}, [path]);

	const onClick = useCallback(
		(e: MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			try {
				void navigator.clipboard.writeText(shareUrl);
				showPopover(`${t("share.popover")}`);
			} catch (error) {
				showPopover("Failed to copy link");
			}
		},
		[isArticle, shareUrl],
	);

	return (
		<>
			<ButtonLink
				onClick={(e) => (shouldShowShareModal() ? setIsOpen(true) : onClick(e))}
				iconCode="external-link"
				text={isArticle ? t("share.name.article") : t("share.name.catalog")}
			/>
			<ShareModal
				setShouldSkipModal={setShareSkipModal}
				path={path}
				shareUrl={shareUrl}
				isArticle={isArticle}
				onCopy={onClick}
				isOpen={isOpen}
				setIsOpen={setIsOpen}
			/>
		</>
	);
};

export default ShareAction;
