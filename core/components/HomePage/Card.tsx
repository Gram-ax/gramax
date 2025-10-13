import CardActions from "@components/HomePage/CardParts/CardActions";
import CardBroken from "@components/HomePage/CardParts/CardBroken";
import CardError, { useCardError } from "@components/HomePage/CardParts/CardError";
import CardCloneProgress from "@components/HomePage/CardParts/CloneProgress";
import useGetCatalogTitleLogo from "@components/HomePage/Cards/useGetCatalogTitleLogo";
import Url from "@core-ui/ApiServices/Types/Url";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useRemoteProgress from "@ext/git/actions/Clone/logic/useRemoteProgress";
import CatalogFetchNotification from "@ext/git/actions/Fetch/CatalogFetchNotification";
import t from "@ext/localization/locale/translate";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { ActionCard, CardFooter, CardSubTitle, CardTitle, CardVisualBadge } from "ics-ui-kit/components/card";
import { ProgressBlockTemplate } from "ics-ui-kit/components/progress";
import { useEffect, useState } from "react";
import Link from "../Atoms/Link";
import { OverflowTooltip } from "@ui-kit/Tooltip";
import { classNames } from "@components/libs/classNames";

interface CardProps {
	link: CatalogLink;
	onClick: () => void;
	className?: string;
	name: string;
}

const GxCard = ({ link, className, onClick, name }: CardProps) => {
	const [isCancel, setIsCancel] = useState(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const { isNext, isStatic } = usePlatform();
	const logo = useGetCatalogTitleLogo(link.name);
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

	const renderLogo = !isCloning && !error && logo;
	const pathname = link.lastVisited || link.pathname;
	const errorCardClassName =
		"border-status-error-secondary-border bg-secondary-bg hover:border-status-error-secondary-border hover:bg-status-error-bg";

	if (isCancel && !isCloning && !error) return null;
	const resolvedStyle = link.style ? { background: `var(--color-card-bg-${link.style})` } : undefined;
	const isError = !!error || !!brokenCloneFailed;

	const card = (
		<ActionCard
			onKeyDown={null}
			data-card="true"
			className={classNames("h-[132px] relative", { [errorCardClassName]: isError }, [className])}
			style={error ? undefined : resolvedStyle}
			onClick={() => {
				if (error) return onClickError();
				if (isNext || isStatic || isCloning) return;
				onClick();
				setIsLoading(true);
			}}
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
				{!isLoading && !isError && <CatalogFetchNotification catalogLink={link} />}
				{isLoading && !isCancel && (
					<div className="w-full" style={{ marginBottom: "-4px" }}>
						<ProgressBlockTemplate indeterminate size="sm" data-qa="loader" />
					</div>
				)}
				{isCloning && (
					<CardCloneProgress name={name} progress={progress} isCancel={isCancel} setIsCancel={setIsCancel} />
				)}
				{!isCloning && !error && brokenCloneFailed && <CardBroken link={link} />}
				{error && <CardError link={link} error={error} />}
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
