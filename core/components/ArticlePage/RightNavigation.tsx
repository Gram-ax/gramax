import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { getArticleLinks, getCatalogLinks } from "@core-ui/getRigthSidebarLinks";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { useRef } from "react";
import { ItemLink } from "../../extensions/navigation/NavigationLinks";
import TableOfContents from "../../extensions/navigation/article/render/TableOfContents";
import Actions from "../Actions";
import ArticleActions from "../Actions/ArticleActions";
import CatalogActions from "../Actions/CatalogActions";
import { Links } from "../Layouts/layoutComponents";
import Tags from "../Tags";

export default styled(({ itemLinks, className }: { itemLinks: ItemLink[]; className?: string }): JSX.Element => {
	const ref = useRef<HTMLDivElement>(null);
	const isLogged = PageDataContextService.value.isLogged;
	const isServerApp = PageDataContextService.value.conf.isServerApp;
	const articleProps = ArticlePropsService.value;

	return (
		<div ref={ref} className="article-right-sidebar">
			<aside className={className}>
				<Actions />
				{articleProps?.errorCode && articleProps.errorCode !== 500 ? null : (
					<>
						<TableOfContents />
						<Links
							articleLinks={getArticleLinks(isLogged, isServerApp)}
							catalogLinks={getCatalogLinks()}
							articleChildren={<ArticleActions />}
							catalogChildren={<CatalogActions itemLinks={itemLinks} />}
						/>
						<Tags tags={articleProps.tags} />
					</>
				)}
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
		margin-left: 0px;
	}
	ul li {
		font-size: 12px !important;
	}

	a {
		font-weight: 300;
		color: var(--color-primary-general);
		text-decoration: none;
	}

	a:hover {
		color: var(--color-primary);
	}

	${cssMedia.medium} {
		opacity: 0.8;
	}
`;
