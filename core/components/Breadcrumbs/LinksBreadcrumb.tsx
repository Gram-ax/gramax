import styled from "@emotion/styled";
import type { ArticleLink, BaseLink, CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import { forwardRef, type MutableRefObject, type ReactNode } from "react";
import Breadcrumb from "./Breadcrumb";

export interface LinksBreadcrumbReadyData<TItem = string> {
	titles: TItem[];
	links: BaseLink[];
	onClicks?: ((e: React.MouseEvent) => void)[];
}

export interface LinksBreadcrumbProps<TItem = unknown> {
	itemLinks?: ItemLink[];
	readyData?: LinksBreadcrumbReadyData<TItem>;
	renderTitle?: (args: { item: TItem }) => ReactNode;
	renderHidden?: (args: { items: TItem[]; hiderElement: ReactNode }) => ReactNode;
	className?: string;
}

const LinksBreadcrumb = forwardRef((props: LinksBreadcrumbProps, ref: MutableRefObject<HTMLDivElement>) => {
	const { itemLinks, readyData, renderTitle, renderHidden, className } = props;

	let titles: unknown[] = [];
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
			className={`${className} breadcrumb`}
			ref={ref}
			style={titles.length && categoryLinks.length ? {} : { visibility: "hidden" }}
		>
			<div className="article-breadcrumb">
				{titles.length && categoryLinks.length ? (
					<Breadcrumb
						content={titles.map((breadcrumb, i) => ({
							value: breadcrumb,
							link: categoryLinks[i],
							onClick: readyData?.onClicks?.[i],
						}))}
						renderHidden={
							renderHidden
								? // biome-ignore lint/suspicious/noExplicitAny: should be TItem[], but forwardRef doesn't support generics
									({ items, hiderElement }) => renderHidden({ items: items as any[], hiderElement })
								: undefined
						}
						renderItem={
							renderTitle
								? ({ item }) =>
										renderTitle({
											// biome-ignore lint/suspicious/noExplicitAny: should be TItem[], but forwardRef doesn't support generics
											item: item as any,
										})
								: undefined
						}
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
