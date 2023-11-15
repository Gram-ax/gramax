import styled from "@emotion/styled";
import { useState } from "react";
import { CatalogLink } from "../../extensions/navigation/NavigationLinks";
import PageDataContextService from "../../ui-logic/ContextServices/PageDataContext";
import { cssMedia } from "../../ui-logic/utils/cssUtils";
import AnyGroup from "./Groups/AnyGroup";
import ProductsGroup from "./Groups/ProductsGroup";
import GroupsName from "./Groups/model/GroupsName";
import NoneGroups from "./NoneGroups";

const Groups = styled(({ links, className }: { links: { [group: string]: CatalogLink[] }; className?: string }) => {
	const [isAnyCardLoading, setIsAnyCardLoading] = useState<boolean>(false);
	const isLogged = PageDataContextService.value.isLogged;
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;

	return (
		<div className={className} style={isAnyCardLoading ? { pointerEvents: "none" } : {}}>
			{Object.keys(links).length ? (
				<div className="groups-container" data-qa="home-page-groups">
					{links[GroupsName.products] ? (
						<ProductsGroup onClick={() => setIsAnyCardLoading(true)} links={links[GroupsName.products]} />
					) : null}
					{links[GroupsName.company] ? (
						<AnyGroup
							onClick={() => setIsAnyCardLoading(true)}
							group={GroupsName.company}
							links={links[GroupsName.company]}
						/>
					) : null}
					{links[GroupsName.projects] ? (
						<AnyGroup
							onClick={() => setIsAnyCardLoading(true)}
							group={GroupsName.projects}
							links={links[GroupsName.projects]}
						/>
					) : null}
				</div>
			) : (
				<NoneGroups isLogged={isLogged} isReadOnly={isReadOnly} />
			)}
		</div>
	);
})`
	flex: 1;
	width: 100%;
	display: flex;

	.groups-container {
		width: 100%;
		display: flex;
		flex-direction: column;
	}

	.group-container {
		gap: 1rem;
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
	}

	.catalog-background {
		width: 100%;
		border-radius: 10px;
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

	@media only screen and (max-width: 80rem) {
		.group-container {
			grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
		}
	}

	${cssMedia.mediumest} {
		.group-container {
			grid-template-columns: 1fr 1fr 1fr 1fr;
		}
	}

	${cssMedia.medium} {
		.group-container {
			grid-template-columns: 1fr 1fr 1fr;
		}
	}

	${cssMedia.narrow} {
		.group-container {
			grid-template-columns: 1fr 1fr;
		}
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

export default Groups;
