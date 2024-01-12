import resolveModule from "@app/resolveModule";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import Url from "@core-ui/ApiServices/Types/Url";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import { HTMLAttributes, useState } from "react";
import useLocalize from "../../../extensions/localization/useLocalize";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import Link from "../../Atoms/Link";
import GroupsName from "./model/GroupsName";

const ProductCard = ({ link, ...props }: { link: CatalogLink } & HTMLAttributes<HTMLAnchorElement>) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const logo = resolveModule("useImage")(apiUrlCreator.getLogoUrl(link.name));
	const [isLoading, setIsLoading] = useState<boolean>(false);

	return (
		<Link
			onClick={(e) => {
				props.onClick?.(e);
				setIsLoading(true);
			}}
			href={Url.from(link)}
			{...props}
		>
			{isLoading && (
				<div className="spinner-loader">
					<SpinnerLoader height={15} width={15}></SpinnerLoader>
				</div>
			)}
	
			<div
				className={`catalog-background block-elevation-hover-1 ${isLoading ? "loading" : ""}`}
				data-qa={`home-page-to-catalog-page-button`}
			>
				<div className={`catalog background-${link.style}`} data-qa="home-page-products-group-catalog">
					<div className={`catalog-titles`}>
						<div
							className={`catalog-title ${"gradient-" + link.style}`}
							data-qa="home-page-catalog-logo-title"
						>
							{link.code.length <= 4 ? link.code : link.code.slice(0, 3) + "..."}
						</div>
						<div
							className="catalog-title-logo"
							style={{ backgroundImage: `url(${logo})` }}
							data-qa="home-page-catalog-logo"
						/>
					</div>
					<div title={link.description} className="catalog-texts">
						<div className="catalog-text-logo" data-qa="home-page-catalog-title">
							{link.title}
						</div>
						<div className="catalog-text" data-qa="home-page-catalog-description">
							{link.description}
						</div>
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
		<div data-qa="home-page-group" className={className}>
			<div className="group-header" data-qa="home-page-group-header">
				{useLocalize(GroupsName.products)}
			</div>
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

	.gradient-1,
	.gradient-blue {
		background-image: linear-gradient(90deg, #0070d8, #25cae0);
	}
	.background-1,
	.background-blue {
		background-color: rgba(0, 112, 216, 0.05) !important;
	}

	.gradient-2,
	.gradient-bright-orange {
		background-image: linear-gradient(90deg, #fd9a25, #ffdd00);
	}
	.background-2,
	.background-bright-orange {
		background-color: rgba(253, 156, 37, 0.05) !important;
	}

	.gradient-3,
	.gradient-dark-orange {
		background-image: linear-gradient(60deg, #ff4e00 0%, #ec9f05 74%);
	}
	.background-3,
	.background-dark-orange {
		background-color: rgba(255, 94, 0, 0.05) !important;
	}

	.gradient-4,
	.gradient-purple {
		background-image: linear-gradient(90deg, #8a42ff, #e240a3);
	}
	.background-4,
	.background-purple {
		background-color: hsl(168deg 65% 97% / 5%) !important;
	}

	.gradient-5,
	.gradient-green {
		background-image: linear-gradient(90deg, #00b09b, #96c93d);
	}
	.background-5,
	.background-green {
		background-color: rgba(0, 183, 18, 0.05) !important;
	}

	.gradient-6,
	.gradient-red {
		background-image: linear-gradient(90deg, #ff041f, #c70e00);
	}

	.background-6,
	.background-red {
		background-color: hsla(354, 100%, 51%, 0.05) !important;
	}

	.gradient-7,
	.gradient-pink-blue {
		background-image: linear-gradient(90deg, #f64f59, #c471ed, #12c2e9);
	}
	.background-7,
	.background-pink-blue {
		background-color: hsl(0deg 65% 97% / 5%) !important;
	}

	.gradient-8,
	.gradient-pink-purple {
		background-image: linear-gradient(90deg, #ff5334, #fb1caf, #c41bff);
	}
	.background-8,
	.background-pink-purple {
		background-color: hsl(168deg 65% 97% / 5%) !important;
	}

	.gradient-9,
	.gradient-orange-green {
		background-image: linear-gradient(90deg, #ff8d07, #cfdf18, #57eb4a);
	}
	.background-9,
	.background-orange-green {
		background-color: hsl(168deg 65% 97% / 5%) !important;
	}

	.gradient-10,
	.gradient-purple-blue {
		background-image: linear-gradient(90deg, #bc02ff, #00e0ff);
	}
	.background-10,
	.background-purple-blue {
		background-color: hsl(168deg 65% 97% / 5%) !important;
	}

	.gradient-11,
	.gradient-red-orange {
		background-image: linear-gradient(90deg, #ff013e, #fc7c61, #ffa800);
	}
	.background-11,
	.background-red-orange {
		background-color: hsl(168deg 65% 97% / 5%) !important;
	}

	.gradient-12,
	.gradient-blue-green {
		background-image: linear-gradient(90deg, #0094c7, #00db72);
	}
	.background-12,
	.background-blue-green {
		background-color: rgba(0, 199, 199, 0.05) !important;
	}

	.gradient-13,
	.gradient-orange-red {
		background-image: linear-gradient(90deg, #f4b206, #fe8955, #ff38b7);
	}
	.background-13,
	.background-orange-red {
		background-color: hsl(168deg 65% 97% / 5%) !important;
	}

	.gradient-14,
	.gradient-green-orange {
		background-image: linear-gradient(90deg, #08dd04, #ffb800);
	}
	.background-14,
	.background-green-orange {
		background-color: hsl(168deg 65% 97% / 5%) !important;
	}

	.gradient-15,
	.gradient-blue-pink {
		background-image: linear-gradient(90deg, #017fff, #ff8ade);
	}
	.background-15,
	.background-blue-pink {
		background-color: hsl(168deg 65% 97% / 5%) !important;
	}

	.gradient-16,
	.gradient-red-green {
		background-image: linear-gradient(90deg, #f05053, #f5ce00, #99db00);
	}
	.background-16,
	.background-red-green {
		background-color: hsl(168deg 65% 97% / 5%) !important;
	}

	.gradient-17,
	.gradient-blue-purple {
		background-image: linear-gradient(90deg, #6083ff, #c023f8);
	}
	.background-17,
	.background-blue-purple {
		background-color: hsl(168deg 65% 97% / 5%) !important;
	}

	.gradient-18,
	.gradient-purple-orange {
		background-image: linear-gradient(90deg, #943ff9, #ff7800);
	}
	.background-18,
	.background-purple-orange {
		background-color: hsl(168deg 65% 97% / 5%) !important;
	}

	.gradient-19,
	.gradient-black {
		background-image: linear-gradient(246.66deg, #8a939d 7.94%, #121315 93.7%);
	}
	.background-19,
	.background-black {
		background-color: (0deg, #ffffff, #ffffff);
	}
`;

export default ProductCardGroupStyled;
