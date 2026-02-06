import styled from "@emotion/styled";
import { ArticleLink, BaseLink, CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import { forwardRef, MutableRefObject } from "react";
import Breadcrumb from "./Breadcrumb";

export interface LinksBreadcrumbProps {
	itemLinks?: ItemLink[];
	readyData?: { titles: string[]; links: BaseLink[]; onClicks?: (() => void)[] };
	className?: string;
}

const LinksBreadcrumb = forwardRef((props: LinksBreadcrumbProps, ref: MutableRefObject<HTMLDivElement>) => {
	const { itemLinks, readyData, className } = props;

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

	if (!titles.length) return <div />;
	return (
		<div
			className={className + " breadcrumb"}
			ref={ref}
			style={titles.length && categoryLinks.length ? {} : { visibility: "hidden" }}
		>
			<div className="article-breadcrumb">
				{titles.length && categoryLinks.length ? (
					<Breadcrumb
						content={titles.map((t, i) => ({
							text: t,
							link: categoryLinks[i],
							onClick: readyData?.onClicks?.[i],
						}))}
					/>
				) : null}
			</div>
		</div>
	);
});

export default styled(LinksBreadcrumb)`
	min-width: 0;
	display: flex;
	align-items: center;

	.article-breadcrumb {
		max-width: 100%;
	}
`;
