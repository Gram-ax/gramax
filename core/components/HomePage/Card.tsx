import CardActions from "@components/HomePage/CardParts/CardActions";
import CardCloneProgress from "@components/HomePage/CardParts/CardCloneProgress";
import CardError, { useCardError } from "@components/HomePage/CardParts/CardError";
import useGetCatalogTitleLogo from "@components/HomePage/Cards/useGetCatalogTitleLogo";
import Url from "@core-ui/ApiServices/Types/Url";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useCloneProgress from "@ext/git/actions/Clone/logic/useCloneProgress";
import CatalogFetchNotification from "@ext/git/actions/Fetch/CatalogFetchNotification";
import t from "@ext/localization/locale/translate";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import { ActionCard, CardFooter, CardSubTitle, CardTitle, CardVisualBadge } from "ics-ui-kit/components/card";
import { ProgressBlockTemplate } from "ics-ui-kit/components/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useState } from "react";
import Link from "../Atoms/Link";

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
	const { isCloning, percentage, progress, error } = useCloneProgress(
		link.isCloning,
		link.name,
		link.redirectOnClone,
		link.cloneCancelDisabled,
		setIsCancel,
	);
	const { onClick: onClickError } = useCardError(link, error);

	const renderLogo = !isCloning && !error && logo;
	const pathname = link.lastVisited || link.pathname;
	const errorCardClassName =
		"border-status-error-secondary-border bg-secondary-bg hover:border-status-error-secondary-border hover:bg-status-error-bg";

	if (isCancel && !isCloning && !error) return null;

	const card = (
		<ActionCard
			onKeyDown={null}
			className={`h-[154px] w-[268px] relative ${className} ${error ? errorCardClassName : ""}`}
			style={
				error
					? { overflow: "visible" }
					: { background: `var(--color-card-bg-${link.style})`, overflow: "visible" }
			}
			onClick={() => {
				if (error) return onClickError();
				if (isNext || isStatic || isCloning) return;
				onClick();
				setIsLoading(true);
			}}
		>
			<CardTitle>{link.title}</CardTitle>
			<CardSubTitle>{link.description}</CardSubTitle>
			{!isLoading && !isCloning && !error && <CardActions catalogLink={link} />}
			<CardFooter className={renderLogo ? "mr-14" : ""}>
				{isLoading && !isCancel && <ProgressBlockTemplate indeterminate size="sm" data-qa="loader" />}
				{isCloning && (
					<CardCloneProgress
						name={name}
						percentage={percentage}
						progress={progress}
						isCancel={isCancel}
						setIsCancel={setIsCancel}
					/>
				)}
				{error && <CardError link={link} error={error} />}
			</CardFooter>

			{renderLogo && (
				<CardVisualBadge>
					<div
						style={{
							backgroundImage: `url(${logo})`,
							height: "100%",
							width: "100%",
							backgroundSize: "contain",
							backgroundPosition: "center center",
							backgroundRepeat: "no-repeat",
						}}
					/>
				</CardVisualBadge>
			)}
			<CatalogFetchNotification catalogLink={link} />
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
