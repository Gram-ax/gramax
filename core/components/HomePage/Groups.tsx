import styled from "@emotion/styled";
import { useState } from "react";
import Group from "./Group";
import NoneGroups from "./NoneGroups";
import GroupsService from "@core-ui/ContextServices/GroupsService";

const Groups = ({ className }: { className?: string }) => {
	const [isAnyCardLoading, setIsAnyCardLoading] = useState(false);
	const { catalogLinks } = GroupsService.value;
	const groupsData = catalogLinks ? Object.values(catalogLinks) : [];
	const catalogCount = groupsData.reduce((total, group) => total + group.catalogLinks.length, 0);

	return (
		<div className={className} style={isAnyCardLoading ? { pointerEvents: "none" } : {}}>
			{catalogCount ? (
				<>
					{groupsData.map((groupData, i) => {
						if (groupData?.catalogLinks.length)
							return <Group key={i} groupData={groupData} setIsAnyCardLoading={setIsAnyCardLoading} />;
					})}
				</>
			) : (
				<NoneGroups />
			)}
		</div>
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
		background: var(--color-home-card-bg);

		border-width: 1px;
		border-style: solid;
		border-color: var(--color-home-card-border);

		transition: border-color var(--transition-time);

		:hover {
			border-color: var(--color-home-card-border-hover);
		}
	}

	.catalog {
		transition: background-color var(--transition-time), box-shadow var(--transition-time) !important;
	}

	.catalog:hover {
		background-color: var(--color-home-card-bg-hover) !important;
	}

	.catalog-title {
		text-transform: lowercase;
		font-family: Montserrat, sans-serif;
		font-size: 2.3rem;
		height: 1.8em;
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

		text-overflow: ellipsis;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		display: -webkit-box;
		overflow: hidden;
	}

	.catalog-text {
		font-size: 12px;
		font-weight: 300;
		line-height: 150%;
		margin-top: 0.5rem;
		overflow: hidden;
		-webkit-line-clamp: 2;
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
