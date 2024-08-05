import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import parseStorageUrl from "@core/utils/parseStorageUrl";
import styled from "@emotion/styled";
import SelectLinkItem from "@ext/artilce/LinkCreator/components/SelectLinkItem";
import LinkItem from "@ext/artilce/LinkCreator/models/LinkItem";
import t from "@ext/localization/locale/translate";
import Button, { ButtonProps } from "@ext/markdown/core/edit/components/Menu/Button";
import { HTMLProps, useEffect, useState } from "react";

interface LinkMenuProps extends HTMLProps<HTMLInputElement> {
	value: string;
	focusOnMount: boolean;
	itemLinks: LinkItem[];
	onDelete: () => void;
	closeMenu: () => void;
	onUpdate: (value: string, href: string) => void;
}

interface CopyButtonProps extends ButtonProps {
	isCopied: boolean;
	isCopyShow: boolean;
}

const StyledDiv = styled.div`
	display: flex;
	gap: 4px;
	width: 300px;
	align-items: center;
`;

const CopyButton = ({ isCopied, isCopyShow, ...otherProps }: CopyButtonProps) =>
	isCopyShow && (
		<>
			<div className="divider" />
			<Button icon="copy" tooltipText={isCopied ? t("copied") + "!" : t("copy")} {...otherProps} />
		</>
	);

const LinkMenu = (props: LinkMenuProps) => {
	const { href, value, itemLinks, onDelete, onUpdate, focusOnMount, closeMenu } = props;
	const [oldHref, setOldHref] = useState(href);
	const [isReady, setIsReady] = useState(false);
	const [isCopied, setIsCopied] = useState(false);
	const [isCopyShow, setIsCopyShow] = useState(false);

	const { isTauri } = usePlatform();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.stopImmediatePropagation();
				closeMenu();
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	const onClickHandler = () => {
		const parsedUrl = parseStorageUrl(href);
		const isArticle = parsedUrl.domain && parsedUrl.domain !== "...";
		const linkToCopy = isArticle ? href : `${window.location.origin}${href}`;
		setIsCopied(true);

		return linkToCopy;
	};

	useEffect(() => {
		setIsCopyShow(href && href !== "/" && !isTauri);
		if (href !== oldHref) setIsReady(false);
		setOldHref(href);
	}, [href]);

	useEffect(() => {
		if (!isReady) {
			setIsCopied(false);
			setIsReady(true);
		}
	}, [isReady]);

	if (!isReady) return null;

	return (
		<ModalLayoutDark>
			<ButtonsLayout>
				<StyledDiv>
					<SelectLinkItem
						focusOnMount={focusOnMount}
						href={href}
						value={value ?? ""}
						itemLinks={itemLinks}
						onChange={onUpdate}
					/>
					<CopyButton
						onMouseLeave={() => setIsCopied(false)}
						onClick={() => navigator.clipboard.writeText(onClickHandler())}
						isCopied={isCopied}
						isCopyShow={isCopyShow}
					/>
					<div className="divider" />
					<Button icon="trash" onClick={onDelete} tooltipText={t("remove-link")} />
				</StyledDiv>
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default LinkMenu;
