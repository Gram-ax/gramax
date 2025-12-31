import { useCtrlKey } from "@core-ui/hooks/useCtrlKey";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { getLinkToHeading } from "@ext/markdown/elements/link/edit/logic/getLinkToHeading";
import GoToArticle from "@components/Actions/GoToArticle";
import { ComponentProps, HTMLAttributes, memo, useState } from "react";
import { Toolbar, ToolbarText, ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import t from "@ext/localization/locale/translate";
import { LinkMenuMode } from "@ext/markdown/elements/link/edit/components/LinkMenu/LinkMenu";
import { useMediaQuery } from "@mui/material";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import parseStorageUrl from "@core/utils/parseStorageUrl";

interface ButtonViewProps {
	href: string;
	icon: string;
	itemName: string;
	isExternalLink: boolean;
}

interface ViewLinkMenuProps extends ButtonViewProps {
	onDelete: () => void;
	setMode: (mode: LinkMenuMode) => void;
}

const Container = styled.div`
	width: 100%;
	max-width: 100%;

	> div {
		max-width: 100%;
	}
`;

const TooltipToolbarButton = (props: ComponentProps<typeof ToolbarToggleButton> & { tooltipText: string }) => {
	return <ToolbarToggleButton tooltipText={props.tooltipText} {...props}></ToolbarToggleButton>;
};

const CopyButton = (props: HTMLAttributes<HTMLButtonElement> & { href: string }) => {
	const { href } = props;
	const [isCopied, setIsCopied] = useState(false);

	const onClickHandler = () => {
		const parsedUrl = parseStorageUrl(href);
		const isArticle = parsedUrl.domain && parsedUrl.domain !== "...";
		const linkToCopy = isArticle ? href : `${window.location.origin}${href}`;

		navigator.clipboard.writeText(linkToCopy);
		setIsCopied(true);
	};

	return (
		<TooltipToolbarButton
			tooltipText={isCopied ? t("copied") + "!" : t("copy")}
			onMouseLeave={() => setIsCopied(false)}
			onClick={onClickHandler}
		>
			<ToolbarIcon icon={isCopied ? "check" : "copy"} />
		</TooltipToolbarButton>
	);
};

const ButtonView = ({ href, icon, itemName, isExternalLink }: ButtonViewProps) => {
	const { isCtrlPressed } = useCtrlKey();
	const { isTauri } = usePlatform();

	const desktopBehavior = isExternalLink ? "_blank" : "_self";
	const browserBehavior = isExternalLink || isCtrlPressed ? "_blank" : "_self";
	const target = isTauri ? desktopBehavior : browserBehavior;

	const hashHatch = getLinkToHeading(href);
	const isCurrentLink = typeof window !== "undefined" ? window.location.pathname === hashHatch?.[1] : false;
	const hrefStartByHash = href.startsWith("#");
	const isHashLink = hashHatch?.[2] && (isCurrentLink || hrefStartByHash);

	const toolbarButton = (
		<Container>
			<ToolbarToggleButton className="text-left flex-1 min-w-0 overflow-hidden justify-start" focusable>
				<ToolbarIcon icon={icon} className="flex-shrink-0" />
				<ToolbarText className="truncate min-w-0 text-xs">{itemName}</ToolbarText>
			</ToolbarToggleButton>
		</Container>
	);

	return target === "_blank" || isHashLink ? (
		<a
			target={target}
			rel="noopener noreferrer"
			className="flex flex-1 min-w-0 overflow-hidden"
			href={isHashLink ? hashHatch?.[2] : href}
		>
			{toolbarButton}
		</a>
	) : (
		<GoToArticle
			containerClassName="flex-1 min-w-0"
			href={href}
			trigger={toolbarButton}
			className="flex flex-1 min-w-0 overflow-hidden"
			style={{ textDecorationLine: "none" }}
		/>
	);
};

export const ViewLinkMenu = memo(({ href, icon, onDelete, setMode, itemName, isExternalLink }: ViewLinkMenuProps) => {
	const isMobile = useMediaQuery(cssMedia.JSnarrow);

	return (
		<div className="rounded-lg lg:shadow-hard-base">
			<Toolbar
				role="link-toolbar"
				className="flex overflow-hidden"
				style={{ width: isMobile ? "100%" : "18.75rem" }}
			>
				<ButtonView href={href} icon={icon} itemName={itemName} isExternalLink={isExternalLink} />
				<TooltipToolbarButton tooltipText={t("edit2")} onClick={() => setMode("edit")}>
					<ToolbarIcon icon="pencil" />
				</TooltipToolbarButton>
				<CopyButton href={href} />
				<TooltipToolbarButton tooltipText={t("remove-link")} onClick={() => onDelete()}>
					<ToolbarIcon icon="unlink" />
				</TooltipToolbarButton>
			</Toolbar>
		</div>
	);
});
