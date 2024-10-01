import { getExecutingEnvironment } from "@app/resolveModule/env";
import Icon from "@components/Atoms/Icon";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import Tooltip from "@components/Atoms/Tooltip";
import BigCard from "@components/HomePage/Cards/BigCard";
import SmallCard from "@components/HomePage/Cards/SmallCard";
import { classNames } from "@components/libs/classNames";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import useCloneProgress from "@ext/git/actions/Clone/logic/useCloneProgress";
import CatalogFetchNotification from "@ext/git/actions/Fetch/CatalogFetchNotification";
import t from "@ext/localization/locale/translate";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import { useState } from "react";

const Card = ({
	link,
	style,
	className,
	onClick,
}: {
	link: CatalogLink;
	style?: "big" | "small";
	onClick?: () => void;
	className?: string;
}) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isCloning, isWait, error } = useCloneProgress(link.isCloning, link.name);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	return (
		<div className={className}>
			<CatalogFetchNotification catalogLink={link} />
			{isLoading && (
				<div className="spinner-loader">
					<SpinnerLoader height={15} width={15} />
				</div>
			)}
			{isCloning && (
				<div className="spinner-loader">
					<Tooltip content={<span>{isWait ? t("loadWait") : t("loading")}</span>}>
						<div>
							<SpinnerLoader className="touch" height={15} width={15} />
						</div>
					</Tooltip>
				</div>
			)}
			{error && (
				<div className="spinner-loader">
					<Tooltip content={<span>{t("clickToViewDetails")}</span>}>
						<div className="error-icon">
							<Icon
								onClick={async () => {
									ErrorConfirmService.notify(error);
									await FetchService.fetch(apiUrlCreator.getRemoveCloneCatalogUrl(link.name));
									ErrorConfirmService.onModalClose = async () => {
										await refreshPage();
									};
								}}
								code="circle-x"
							/>
						</div>
					</Tooltip>
				</div>
			)}
			<div
				className={classNames("card", { cloning: isCloning || !!error }, ["block-elevation-hover-1"])}
				onClick={() => {
					if (getExecutingEnvironment() === "next") return;
					onClick?.();
					setIsLoading(true);
				}}
			>
				{style === "big" ? <BigCard link={link} /> : <SmallCard link={link} />}
			</div>
		</div>
	);
};

export default styled(Card)`
	position: relative;

	.card {
		cursor: pointer;
		border-radius: var(--radius-large);
		overflow: hidden;
	}

	.error-icon {
		cursor: pointer;
		line-height: 100%;
		color: var(--color-danger);
		opacity: 0.7;
	}
	.error-icon:hover {
		opacity: 1;
	}

	.cloning {
		opacity: 0.5;
		pointer-events: none;
	}

	.spinner-loader {
		height: 100%;
		width: 100%;
		z-index: 100;
		display: flex;
		align-items: end;
		justify-content: right;
		padding: 0.5rem;
		position: absolute;
	}

	.loading {
		opacity: 0.7;
	}
`;
