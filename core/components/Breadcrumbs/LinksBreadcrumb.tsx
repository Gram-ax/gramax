import styled from "@emotion/styled";
import { ArticleLink, BaseLink, CatalogLink, CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import { CatalogLogo } from "../CatalogLogo";
import Breadcrumb from "./Breadcrumb";
import { forwardRef, MutableRefObject } from "react";

interface BreadcrumbProps {
	itemLinks?: ItemLink[];
	catalogLink?: CatalogLink;
	readyData?: { titles: string[]; links: BaseLink[] };
	className?: string;
}

const LinksBreadcrumb = forwardRef((props: BreadcrumbProps, ref: MutableRefObject<HTMLDivElement>) => {
	const { itemLinks, catalogLink, readyData, className } = props;
	let titles: string[] = [];
	let lastIsIndexArticle = false;
	let categoryLinks: BaseLink[] = [];

	const setTitlesAndLinks = (newCategoryLinks: CategoryLink[]) => {
		titles = newCategoryLinks.map((l) => l.title);
		categoryLinks = newCategoryLinks;
	};

	const search = (itemLinks: ItemLink[], catLinks: CategoryLink[]) => {
		itemLinks.forEach((x) => {
			if (!(x as CategoryLink).items) {
				if ((x as ArticleLink).isCurrentLink) {
					setTitlesAndLinks(catLinks);
					lastIsIndexArticle = false;
				}
			} else {
				const categoryLink = x as CategoryLink;
				const newCategoryLinks = [...catLinks, categoryLink];
				if (categoryLink.isCurrentLink) {
					setTitlesAndLinks(newCategoryLinks);
					lastIsIndexArticle = true;
				} else search(categoryLink.items, newCategoryLinks);
			}
		});
	};

	if (itemLinks) search(itemLinks, []);
	if (lastIsIndexArticle) titles.pop();
	if (readyData) {
		titles = readyData.titles;
		categoryLinks = readyData.links;
	}

	return (
		<div
			ref={ref}
			className={className + " breadcrumb"}
			style={catalogLink || (titles.length && categoryLinks.length) ? {} : { visibility: "hidden" }}
		>
			{catalogLink ? (
				<>
					<a className="catalog-logo">
						<CatalogLogo catalogName={catalogLink.name} />
						<span className="title">{catalogLink.title}</span>
					</a>
				</>
			) : null}

			<div className="article-breadcrumb">
				{titles.length && categoryLinks.length ? (
					<Breadcrumb
						content={titles.map((t, i) => ({
							text: t,
							link: categoryLinks[i],
						}))}
					/>
				) : null}
			</div>
		</div>
	);
});

export default styled(LinksBreadcrumb)`
	display: flex;
	align-items: center;

	img {
		margin: 0px !important;
		max-width: 25px !important;
		max-height: 15px !important;
		box-shadow: none !important;
	}

	.title {
		font-size: 10px;
		font-weight: 600;
		margin-left: 0.2rem;
		white-space: nowrap;
	}

	.catalog-logo {
		display: flex;
		align-items: center;
	}
`;
