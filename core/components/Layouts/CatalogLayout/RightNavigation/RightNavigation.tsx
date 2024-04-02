import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { getCatalogLinks, useGetArticleLinks } from "@core-ui/getRigthSidebarLinks";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import TableOfContents from "@ext/navigation/article/render/TableOfContents";
import { useRef } from "react";
import Actions from "../../../Actions";
import ArticleActions from "../../../Actions/ArticleActions";
import CatalogActions from "../../../Actions/CatalogActions";
import Tags from "../../../Tags";
import Links from "../../layoutComponents";

export default styled(({ itemLinks, className }: { itemLinks: ItemLink[]; className?: string }): JSX.Element => {
	const ref = useRef<HTMLDivElement>(null);
	const articleProps = ArticlePropsService.value;
	const showArticleActions = !((articleProps?.errorCode && articleProps.errorCode !== 500) || !articleProps.fileName);
	const articleLinks = useGetArticleLinks();

	return (
		<div ref={ref} className="article-right-sidebar">
			<aside className={className}>
				<Actions />
				{showArticleActions && <TableOfContents />}
				<Links
					articleLinks={showArticleActions ? articleLinks : []}
					catalogLinks={getCatalogLinks()}
					articleChildren={showArticleActions ? <ArticleActions /> : null}
					catalogChildren={<CatalogActions itemLinks={itemLinks} />}
				/>
				{showArticleActions && <Tags tags={articleProps.tags} />}
			</aside>
		</div>
	);
})`
	width: 100%;
	height: 100%;
	color: var(--color-primary-general);
	background-color: var(--color-contextmenu-bg);

	ul {
		list-style-type: none;
		margin-left: 0;
	}

	ul li {
		font-size: 12px;
	}

	a {
		font-weight: 300;
		color: var(--color-primary-general);
		text-decoration: none;

		&:hover {
			color: var(--color-primary);
		}
	}

	${cssMedia.medium} {
		opacity: 0.8;
	}
`;
