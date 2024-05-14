import resolveModule from "@app/resolveModule/frontend";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import Url from "@core-ui/ApiServices/Types/Url";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import { HTMLAttributes, useState } from "react";
import useLocalize from "../../../extensions/localization/useLocalize";
import Link from "../../Atoms/Link";
import GroupsName from "./model/GroupsName";
import { getExecutingEnvironment } from "@app/resolveModule/env";

const ProductCard = ({ link, ...props }: { link: CatalogLink } & HTMLAttributes<HTMLAnchorElement>) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const logo = resolveModule("useImage")(apiUrlCreator.getLogoUrl(link.name));
	const [isLoading, setIsLoading] = useState<boolean>(false);

	return (
		<Link
			{...props}
			href={Url.from(link)}
			onClick={(ev) => {
				if (getExecutingEnvironment() == "next" || ev.currentTarget.target === "_blank") return;
				props.onClick?.(ev);
				setIsLoading(true);
			}}
		>
			{isLoading && (
				<div className="spinner-loader">
					<SpinnerLoader height={15} width={15}></SpinnerLoader>
				</div>
			)}

			<div className={`catalog-background block-elevation-hover-1 ${isLoading ? "loading" : ""}`}>
				<div className={`catalog background-${link.style}`}>
					<div className={`catalog-titles`}>
						<div className={`catalog-title ${"gradient-" + link.style}`}>
							{link.code.length <= 4 ? link.code : link.code.slice(0, 3) + "..."}
						</div>
						<div className="catalog-title-logo" style={logo && { backgroundImage: `url(${logo})` }} />
					</div>
					<div title={link.description} className="catalog-texts">
						<div className="catalog-text-logo">{link.title}</div>
						<div className="catalog-text">{link.description}</div>
					</div>
				</div>
			</div>
		</Link>
	);
};

const ProductCardStyled = styled(ProductCard)`
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

const ProductCardGroup = ({
	links,
	className,
	...props
}: { links: CatalogLink[] } & HTMLAttributes<HTMLAnchorElement>) => {
	return (
		<div className={className}>
			<div className="group-header">{useLocalize(GroupsName.products)}</div>
			<div className="group-container">
				{links.map((link, i) => (
					<ProductCardStyled link={link} key={i} {...props} />
				))}
			</div>
		</div>
	);
};

const ProductCardGroupStyled = styled(ProductCardGroup)`
	width: 100%;

	.group-title {
		line-height: 35px;
		margin-bottom: 1rem;
		letter-spacing: 0.04em;
	}

	.catalog {
		display: flex;
		cursor: pointer;
		height: 11.7rem;
		overflow: hidden;
		position: relative;
		border-radius: 10px;
		padding: 1rem 1.2rem;
		flex-direction: column;
	}

	.catalog-titles {
		display: flex;
		align-items: center;
		flex-direction: row;
		justify-content: space-between;
	}

	.catalog-title {
		color: transparent;
		-webkit-background-clip: text;
	}

	@media only screen and (max-width: 380px) {
		.catalog {
			height: 8.7rem;
			padding: 0.5rem 0.7rem;
		}
	}

	@media only screen and (max-width: 320px) {
		.catalog {
			padding: 1rem 1.2rem;
			height: 10.7rem;
		}
	}
`;

export default ProductCardGroupStyled;
