import GoToArticle from "@components/Actions/GoToArticle";
import parseStorageUrl from "@core/utils/parseStorageUrl";
import { useCtrlKey } from "@core-ui/hooks/useCtrlKey";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import type { LinkMenuMode } from "@ext/markdown/elements/link/edit/components/LinkMenu/LinkMenu";
import { getLinkToHeading } from "@ext/markdown/elements/link/edit/logic/getLinkToHeading";
import { useMediaQuery } from "@mui/material";
import { Toolbar, ToolbarIcon, ToolbarText, ToolbarToggleButton } from "@ui-kit/Toolbar";
import { type ComponentProps, type HTMLAttributes, memo, useState } from "react";

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
		let linkToCopy: string;

		if (URL.canParse(href)) linkToCopy = new URL(href).href;
		else {
			const parsedUrl = parseStorageUrl(href);
			const isArticle = parsedUrl.domain && parsedUrl.domain !== "...";
			linkToCopy = isArticle ? href : `${window.location.origin}${href}`;
		}

		navigator.clipboard.writeText(linkToCopy);
		setIsCopied(true);
	};

	return (
		<TooltipToolbarButton
			onClick={onClickHandler}
			onMouseLeave={() => setIsCopied(false)}
			tooltipText={isCopied ? `${t("copied")}!` : t("copy")}
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
				<ToolbarIcon className="flex-shrink-0" icon={icon} />
				<ToolbarText className="truncate min-w-0 text-xs">{itemName}</ToolbarText>
			</ToolbarToggleButton>
		</Container>
	);

	return target === "_blank" || isHashLink ? (
		<a
			className="flex flex-1 min-w-0 overflow-hidden"
			href={isHashLink ? hashHatch?.[2] : href}
			rel="noopener noreferrer"
			target={target}
		>
			{toolbarButton}
		</a>
	) : (
		<GoToArticle
			className="flex flex-1 min-w-0 overflow-hidden"
			containerClassName="flex-1 min-w-0"
			href={href}
			style={{ textDecorationLine: "none" }}
			trigger={toolbarButton}
		/>
	);
};

export const ViewLinkMenu = memo(({ href, icon, onDelete, setMode, itemName, isExternalLink }: ViewLinkMenuProps) => {
	const isMobile = useMediaQuery(cssMedia.JSnarrow);

	return (
		<div className="rounded-lg lg:shadow-hard-base">
			<Toolbar
				className="flex overflow-hidden"
				role="link-toolbar"
				style={{ width: isMobile ? "100%" : "18.75rem" }}
			>
				<ButtonView href={href} icon={icon} isExternalLink={isExternalLink} itemName={itemName} />
				<TooltipToolbarButton onClick={() => setMode("edit")} tooltipText={t("edit2")}>
					<ToolbarIcon icon="pencil" />
				</TooltipToolbarButton>
				<CopyButton href={href} />
				<TooltipToolbarButton onClick={() => onDelete()} tooltipText={t("remove-link")}>
					<ToolbarIcon icon="unlink" />
				</TooltipToolbarButton>
			</Toolbar>
		</div>
	);
});
