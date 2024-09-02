import CatalogSyncService from "@core-ui/ContextServices/CatalogSync";
import type { CatalogsLinks } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import { useState } from "react";
import Group from "./Group";
import NoneGroups from "./NoneGroups";

const Groups = ({ catalogsLinks, className }: { catalogsLinks: CatalogsLinks; className?: string }) => {
	const [isAnyCardLoading, setIsAnyCardLoading] = useState(false);
	const groupsData = catalogsLinks ? Object.values(catalogsLinks) : [];
	const catalogCount = groupsData.reduce((total, group) => total + group.catalogLinks.length, 0);

	return (
		<CatalogSyncService.Provider>
			<div className={className} style={isAnyCardLoading ? { pointerEvents: "none" } : {}}>
				{catalogCount ? (
					<>
						{groupsData.map((groupData, i) => {
							if (groupData?.catalogLinks.length)
								return (
									<Group key={i} groupData={groupData} setIsAnyCardLoading={setIsAnyCardLoading} />
								);
						})}
					</>
				) : (
					<NoneGroups />
				)}
			</div>
		</CatalogSyncService.Provider>
	);
};

export default styled(Groups)`
	flex: 1;
	width: 100%;
	display: flex;
	flex-direction: column;

	.catalog-background {
		width: 100%;
		border-radius: var(--radius-large);
		background: var(--color-block);
	}

	.catalog {
		transition: background-color 0.3s, box-shadow 0.3s !important;
	}

	.catalog:hover {
		background-color: var(--color-block-hover) !important;
	}

	.catalog-title {
		text-transform: lowercase;
		font-family: Montserrat;
		font-size: 2.3rem;
	}

	.catalog-texts {
		display: flex;
		margin-top: 1rem;
		flex-direction: column;
	}
	.catalog-text-logo {
		font-size: 16px;
		line-height: 23px;
		font-weight: normal;
		letter-spacing: 0.01em;
	}
	.catalog-text {
		font-size: 12px;
		font-weight: 300;
		line-height: 150%;
		margin-top: 0.5rem;
		overflow: hidden;
		-webkit-line-clamp: 3;
		display: -webkit-box;
		-webkit-box-orient: vertical;
	}

	.catalog-title-logo {
		top: -2rem;
		height: 9rem;
		width: 7.5rem;
		display: flex;
		right: -2.2rem;
		max-width: 50%;
		position: absolute;
		justify-content: center;
		background-size: contain;
		background-position: center center;
		background-repeat: no-repeat !important;
	}

	@media only screen and (max-width: 380px) {
		.catalog-title-logo {
			top: -1.5rem;
			right: -1.7rem;
			max-height: 80%;
		}
		.catalog-title {
			font-size: 1.7rem;
		}
		.catalog-text-logo {
			font-size: 14px;
		}
		.catalog-text {
			font-size: 10px;
		}
	}

	@media only screen and (max-width: 320px) {
		.group-container {
			grid-template-columns: 1fr;
		}

		.catalog-title-logo {
			top: -2rem;
			right: -2.2rem;
			max-height: none;
		}

		.catalog-title {
			font-size: 2.2rem;
		}
		.catalog-text-logo {
			font-size: 17px;
		}
		.catalog-text {
			font-size: 12px;
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
		background-color: #8a42ff0d !important;
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
		background-color: hsl(282deg 100% 47.9% / 5%) !important;
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
		background-color: hsl(0deg 0% 0% / 5%) !important;
	}
`;
