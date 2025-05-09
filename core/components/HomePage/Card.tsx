import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import CardCloneProgress from "@components/HomePage/CardParts/CardCloneProgress";
import CardError from "@components/HomePage/CardParts/CardError";
import RightBottomExtWrapper from "@components/HomePage/CardParts/RightBottomExt";
import BigCard from "@components/HomePage/Cards/BigCard";
import SmallCard from "@components/HomePage/Cards/SmallCard";
import { classNames } from "@components/libs/classNames";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import useCloneProgress from "@ext/git/actions/Clone/logic/useCloneProgress";
import CatalogFetchNotification from "@ext/git/actions/Fetch/CatalogFetchNotification";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import { useState } from "react";

interface CardProps {
	link: CatalogLink;
	style?: "big" | "small";
	onClick?: () => void;
	className?: string;
	name: string;
}

const Loader = () => {
	return (
		<RightBottomExtWrapper>
			<SpinnerLoader height={15} width={15} />
		</RightBottomExtWrapper>
	);
};

const Card = ({ link, style, className, onClick, name }: CardProps) => {
	const { isCloning, percentage, progress, error } = useCloneProgress(
		link.isCloning,
		link.name,
		link.redirectOnClone,
	);

	const [isCancel, setIsCancel] = useState(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const { isNext } = usePlatform();

	if (isCancel && !isCloning && !error) return null;

	return (
		<div className={className}>
			<CatalogFetchNotification catalogLink={link} />
			{isLoading && <Loader />}
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
			<div
				className={classNames("card", { cloning: isCloning || !!error }, ["block-elevation-hover-1"])}
				onClick={() => {
					if (isNext) return;
					onClick?.();
					setIsLoading(true);
				}}
			>
				{style === "big" ? (
					<BigCard link={link} hideLogo={isCloning} />
				) : (
					<SmallCard link={link} hideLogo={isCloning} />
				)}
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

	.cloning {
		opacity: 0.5;
		pointer-events: none;
	}

	.loading {
		opacity: 0.7;
	}
`;
