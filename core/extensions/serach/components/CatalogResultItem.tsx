import { css } from "@emotion/react";
import BreadcrumbCatalog from "@ext/serach/components/BreadcrumbCatalog";
import { getMarkElems } from "@ext/serach/components/searchUtils";
import { SearchResultMarkItem } from "@ext/serach/Searcher";

const catalogResultItemVariant = css`
	img {
		max-width: 1.25rem;
		max-height: 1.25rem;
	}

	.title {
		font-size: inherit;
		font-weight: inherit;
	}
`;

export interface CatalogResultItemProps {
	catalog: { name: string; title: SearchResultMarkItem[] };
}

export const CatalogResultItem = ({ catalog }: CatalogResultItemProps) => {
	return (
		<BreadcrumbCatalog
			catalog={{
				name: catalog.name,
				title: getMarkElems(catalog.title),
			}}
			variant={catalogResultItemVariant}
		/>
	);
};
