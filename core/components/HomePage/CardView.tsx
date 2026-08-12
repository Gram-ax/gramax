import CardActions from "@components/HomePage/CardParts/CardActions";
import CardBroken from "@components/HomePage/CardParts/CardBroken";
import CardError from "@components/HomePage/CardParts/CardError";
import CardCloneProgress from "@components/HomePage/CardParts/CloneProgress";
import { classNames } from "@components/libs/classNames";
import type { CatalogLogo } from "@core-ui/ContextServices/CatalogLogoService/catalogLogoHooks";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import type DefaultError from "@ext/errorHandlers/logic/DefaultError";
import CatalogFetchNotification from "@ext/git/actions/Fetch/CatalogFetchNotification";
import type { RemoteProgressPercentage } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import t from "@ext/localization/locale/translate";
import type { CatalogLink } from "@ext/navigation/NavigationLinks";
import { ActionCard, CardFooter, CardSubTitle, CardTitle } from "@ui-kit/Card";
import { ProgressBlockTemplate } from "@ui-kit/Progress";
import { OverflowTooltip } from "@ui-kit/Tooltip";
import { CardLogo } from "./CardParts/CardLogo";

export interface CardViewProps {
	name: string;
	className?: string;
	logo?: CatalogLogo;
	link?: CatalogLink;
	isLoading?: boolean;
	isCloning?: boolean;
	isCancel?: boolean;
	isError?: boolean;
	isReadOnly?: boolean;
	brokenCloneFailed?: boolean;
	progress?: RemoteProgressPercentage;
	error?: DefaultError;
	setIsCancel?: (v: boolean) => void;
	onCardClick?: () => void;
	onErrorClick?: () => void;
}

const errorCardClassName =
	"border-status-error-secondary-border bg-secondary-bg hover:border-status-error-secondary-border hover:bg-status-error-bg";

const CardView = (props: CardViewProps) => {
	const {
		name,
		className,
		logo,
		link,
		isLoading,
		isCloning,
		isCancel,
		isError,
		isReadOnly,
		brokenCloneFailed,
		progress,
		error,
		setIsCancel,
		onCardClick,
		onErrorClick,
	} = props;
	const { isNext, isStatic, isDocportal } = usePlatform();
	const renderLogo = !!(!isCloning && !error && logo);

	return (
		<ActionCard
			className={classNames("h-[132px] relative", { [errorCardClassName]: isError }, [className])}
			data-card="true"
			onClick={() => {
				if (isReadOnly) return;
				if (error) return onErrorClick();
				if (isNext || isStatic || isDocportal || isCloning) return;
				onCardClick();
			}}
			onKeyDown={null}
			style={error ? undefined : link?.style ? { background: `var(--color-card-bg-${link?.style})` } : undefined}
		>
			<CardTitle>
				<OverflowTooltip className="line-clamp-2">{link?.title || t("article.no-name")}</OverflowTooltip>
			</CardTitle>
			<CardSubTitle>
				<OverflowTooltip className={classNames("line-clamp-2", { "pr-14": renderLogo }, [])}>
					{link?.description}
				</OverflowTooltip>
			</CardSubTitle>
			{link && !isReadOnly && !isLoading && !isCloning && !isError && <CardActions catalogLink={link} />}
			<CardFooter className={`flex ${renderLogo ? "mr-14" : ""}`}>
				{link && !isReadOnly && !isLoading && !isError && !isCloning && (
					<CatalogFetchNotification catalogLink={link} />
				)}
				{isLoading && !isCancel && (
					<div className="w-full -mb-1">
						<ProgressBlockTemplate data-qa="loader" indeterminate size="sm" />
					</div>
				)}
				{isCloning && (
					<CardCloneProgress isCancel={isCancel} name={name} progress={progress} setIsCancel={setIsCancel} />
				)}
				{link && !isReadOnly && !isCloning && !error && brokenCloneFailed && <CardBroken link={link} />}
				{link && !isReadOnly && error && <CardError error={error} link={link} />}
			</CardFooter>

			{renderLogo && <CardLogo logo={logo} />}
		</ActionCard>
	);
};

export default CardView;
