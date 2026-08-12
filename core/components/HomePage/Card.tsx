import { useCardError } from "@components/HomePage/CardParts/CardError";
import { clearCardLoading, setCardLoading, useCardLoading } from "@components/HomePage/CardParts/CardStore";
import Url from "@core-ui/ApiServices/Types/Url";
import { useGetCatalogLogoSrc } from "@core-ui/ContextServices/CatalogLogoService/catalogLogoHooks";
import Workspace from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useRemoteProgress from "@ext/git/actions/Clone/logic/useRemoteProgress";
import t from "@ext/localization/locale/translate";
import type { CatalogLink } from "@ext/navigation/NavigationLinks";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useEffect, useState } from "react";
import Link from "../Atoms/Link";
import CardView from "./CardView";

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
	const { isStatic } = usePlatform();

	const { isCloning, progress, error, start } = useRemoteProgress(
		link.name,
		link.redirectOnClone,
		link.cloneCancelDisabled,
		setIsCancel,
	);
	const { logo } = useGetCatalogLogoSrc(link.name, [workspace, isCloning, error]);
	const brokenCloneFailed = link.broken === "clone-failed";
	const { onClick: onClickError } = useCardError(link, error);

	useEffect(() => {
		if (link.isCloning && !isCloning && !(progress?.type === "finish" || progress?.type === "error")) start();
	}, [link, start, progress, isCloning]);

	useEffect(() => {
		return () => {
			clearCardLoading(link.name);
		};
	}, [link.name]);

	if (isCancel && !isCloning && !error) return null;

	const isError = !!error || !!brokenCloneFailed;
	const pathname = link.lastVisited || link.pathname;

	const card = (
		<CardView
			brokenCloneFailed={brokenCloneFailed}
			className={className}
			error={error}
			isCancel={isCancel}
			isCloning={isCloning}
			isError={isError}
			isLoading={isLoading}
			link={link}
			logo={logo}
			name={name}
			onCardClick={() => {
				onClick();
				setCardLoading(link.name, true);
			}}
			onErrorClick={onClickError}
			progress={progress}
			setIsCancel={setIsCancel}
		/>
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

	if (typeof window === "undefined") return card;
	return (
		<Link data-catalog-card={name} href={Url.from({ pathname })}>
			{card}
		</Link>
	);
};

export default GxCard;
