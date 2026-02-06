import CardActions from "@components/HomePage/CardParts/CardActions";
import CardBroken from "@components/HomePage/CardParts/CardBroken";
import CardError, { useCardError } from "@components/HomePage/CardParts/CardError";
import { clearCardLoading, setCardLoading, useCardLoading } from "@components/HomePage/CardParts/CardStore";
import CardCloneProgress from "@components/HomePage/CardParts/CloneProgress";
import useGetCatalogTitleLogo from "@components/HomePage/Cards/useGetCatalogTitleLogo";
import { classNames } from "@components/libs/classNames";
import Url from "@core-ui/ApiServices/Types/Url";
import Workspace from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useRemoteProgress from "@ext/git/actions/Clone/logic/useRemoteProgress";
import CatalogFetchNotification from "@ext/git/actions/Fetch/CatalogFetchNotification";
import t from "@ext/localization/locale/translate";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import { ActionCard, CardFooter, CardSubTitle, CardTitle, CardVisualBadge } from "@ui-kit/Card";
import { ProgressBlockTemplate } from "@ui-kit/Progress";
import { OverflowTooltip, Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useEffect, useState } from "react";
import Link from "../Atoms/Link";

interface CardProps {
	link: CatalogLink;
	onClick: () => void;
	className?: string;
	name: string;
}

const GxCard = ({ link, className, onClick, name }: CardProps) => {
	const [isCancel, setIsCancel] = useState(false);
	const isLoading = useCardLoading(link.name);

	const workspace = Workspace.current()?.path;

	const { isNext, isStatic } = usePlatform();
	const logo = useGetCatalogTitleLogo(link.name, [workspace]);
	const { isCloning, progress, error, start } = useRemoteProgress(
		link.name,
		link.redirectOnClone,
		link.cloneCancelDisabled,
		setIsCancel,
	);
	const brokenCloneFailed = link.broken === "clone-failed";
	const { onClick: onClickError } = useCardError(link, error);

	useEffect(() => {
		if (link.isCloning && !isCloning && !(progress?.type == "finish" || progress?.type == "error")) start();
	}, [link, start, progress, isCloning]);

	useEffect(() => {
		return () => {
			clearCardLoading(link.name);
		};
	}, [link.name]);

	const renderLogo = !isCloning && !error && logo;
	const pathname = link.lastVisited || link.pathname;
	const errorCardClassName =
		"border-status-error-secondary-border bg-secondary-bg hover:border-status-error-secondary-border hover:bg-status-error-bg";

	if (isCancel && !isCloning && !error) return null;
	const resolvedStyle = link.style ? { background: `var(--color-card-bg-${link.style})` } : undefined;
	const isError = !!error || !!brokenCloneFailed;

	const card = (
		<ActionCard
			className={classNames("h-[132px] relative", { [errorCardClassName]: isError }, [className])}
			data-card="true"
			onClick={() => {
				if (error) return onClickError();
				if (isNext || isStatic || isCloning) return;
				onClick();
				setCardLoading(link.name, true);
			}}
			onKeyDown={null}
			style={error ? undefined : resolvedStyle}
		>
			<CardTitle>
				<OverflowTooltip className="line-clamp-2">{link.title}</OverflowTooltip>
			</CardTitle>
			<CardSubTitle>
				<OverflowTooltip className={classNames("line-clamp-2", { "pr-14": renderLogo }, [])}>
					{link.description}
				</OverflowTooltip>
			</CardSubTitle>
			{!isLoading && !isCloning && !isError && <CardActions catalogLink={link} />}
			<CardFooter className={`flex ${renderLogo ? "mr-14" : ""}`}>
				{!isLoading && !isError && !isCloning && <CatalogFetchNotification catalogLink={link} />}
				{isLoading && !isCancel && (
					<div className="w-full" style={{ marginBottom: "-4px" }}>
						<ProgressBlockTemplate data-qa="loader" indeterminate size="sm" />
					</div>
				)}
				{isCloning && (
					<CardCloneProgress isCancel={isCancel} name={name} progress={progress} setIsCancel={setIsCancel} />
				)}
				{!isCloning && !error && brokenCloneFailed && <CardBroken link={link} />}
				{error && <CardError error={error} link={link} />}
			</CardFooter>

			{renderLogo && (
				<CardVisualBadge style={{ bottom: "-2px", right: "-2px" }}>
					<div
						style={{
							backgroundImage: `url(${logo})`,
							height: "100%",
							width: "100%",
							backgroundSize: "contain",
							backgroundPosition: "center center",
							backgroundRepeat: "no-repeat",
							marginLeft: "2px",
							marginTop: "2px",
						}}
					/>
				</CardVisualBadge>
			)}
		</ActionCard>
	);

	if (error)
		return (
			<Tooltip delayDuration={0}>
				<TooltipTrigger asChild>{card}</TooltipTrigger>
				<TooltipContent>
					<span>{t("clickToViewDetails")}</span>
				</TooltipContent>
			</Tooltip>
		);

	if (isCloning) return card;

	if (isStatic)
		return (
			<a data-catalog-card={name} href={pathname}>
				{card}
			</a>
		);

	return (
		<Link data-catalog-card={name} href={Url.from({ pathname })}>
			{card}
		</Link>
	);
};

export default GxCard;
