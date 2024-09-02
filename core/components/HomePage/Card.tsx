import { getExecutingEnvironment } from "@app/resolveModule/env";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import BigCard from "@components/HomePage/Cards/BigCard";
import SmallCard from "@components/HomePage/Cards/SmallCard";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import CatalogFetchNotification from "@ext/git/actions/Fetch/CatalogFetchNotification";
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
	const [isLoading, setIsLoading] = useState<boolean>(false);

	return (
		<div className={className}>
			<CatalogFetchNotification catalogLink={link} />
			<div
				className={classNames("card", {}, ["block-elevation-hover-1"])}
				onClick={() => {
					if (getExecutingEnvironment() === "next") return;
					onClick?.();
					setIsLoading(true);
				}}
			>
				{isLoading && (
					<div className="spinner-loader">
						<SpinnerLoader height={15} width={15} />
					</div>
				)}
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
