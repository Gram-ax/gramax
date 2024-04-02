import resolveModule from "@app/resolveModule/frontend";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import Url from "@core-ui/ApiServices/Types/Url";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import { HTMLAttributes, useState } from "react";
import useLocalize from "../../../extensions/localization/useLocalize";
import { CatalogLink } from "../../../extensions/navigation/NavigationLinks";
import Link from "../../Atoms/Link";
import GroupsName from "./model/GroupsName";

const AnyCard = ({ link, ...props }: { link: CatalogLink } & HTMLAttributes<HTMLAnchorElement>) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const useImage = resolveModule("useImage");
	const [isLoading, setIsLoading] = useState<boolean>(false);

	return (
		<Link
			{...props}
			href={Url.from(link)}
			onClick={(e) => {
				props.onClick?.(e);
				setIsLoading(true);
			}}
		>
			<a
				className={`catalog-background block-elevation-hover-1 background-${link.style} ${
					isLoading ? "loading" : ""
				}`}
			>
				{isLoading ? (
					<div className="spinner-loader">
						<SpinnerLoader height={15} width={15}></SpinnerLoader>
					</div>
				) : null}
				<div className="catalog">
					<div
						className="catalog-title-logo"
						style={{ backgroundImage: `url(${useImage(apiUrlCreator.getLogoUrl(link.name))})` }}
					/>
					<div title={link.description} className="catalog-texts">
						<div className="catalog-text-logo">{link.title}</div>
						<div className="catalog-text">{link.description}</div>
					</div>
				</div>
			</a>
		</Link>
	);
};

const AnyCardStyled = styled(AnyCard)`
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

const AnyCardGroup = ({
	group,
	links,
	className,
	...props
}: { group: GroupsName; links: CatalogLink[] } & HTMLAttributes<HTMLAnchorElement>) => {
	return (
		<div className={className}>
			<div className="group-header">{useLocalize(group)}</div>
			<div className="group-container">
				{links.map((link, i) => (
					<AnyCardStyled link={link} key={i} {...props} />
				))}
			</div>
		</div>
	);
};

const AnyCardGroupStyled = styled(AnyCardGroup)`
	width: 100%;
	position: relative;

	.group-title {
		line-height: 35px;
		letter-spacing: 0.04em;
	}

	.catalog {
		height: 8rem;
		padding: 1rem;
		display: flex;
		cursor: pointer;
		overflow: hidden;
		position: relative;
		border-radius: 10px;
		flex-direction: column;
		align-items: flex-start;
		scroll-snap-align: start;
	}

	.catalog-texts {
		width: 68%;
	}

	@media only screen and (max-width: 380px) {
		.catalog {
			padding: 0.5rem;
			height: 7.5rem;
		}
	}
	@media only screen and (max-width: 320px) {
		.catalog {
			padding: 1rem;
			height: 8rem;
		}
	}
`;

export default AnyCardGroupStyled;
