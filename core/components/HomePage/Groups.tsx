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
`;
