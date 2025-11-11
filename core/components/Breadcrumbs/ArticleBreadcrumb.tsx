import Icon from "@components/Atoms/Icon";
import LinksBreadcrumb from "@components/Breadcrumbs/LinksBreadcrumb";
import { classNames } from "@components/libs/classNames";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import IsMobileService from "@core-ui/ContextServices/isMobileService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import useWatch from "@core-ui/hooks/useWatch";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import styled from "@emotion/styled";
import getArticleItemLink from "@ext/article/LinkCreator/logic/getArticleItemLink";
import ItemMenu from "@ext/item/EditMenu";
import NavigationDropdown from "@ext/navigation/components/NavigationDropdown";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import Properties from "@ext/properties/components/Properties";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { Button } from "@ui-kit/Button";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface ArticleBreadcrumbProps {
	className?: string;
	itemLinks: ItemLink[];
	hasPreview: boolean;
}

const ArticleBreadcrumb = ({ className, itemLinks }: ArticleBreadcrumbProps) => {
	const linksRef = useRef<HTMLDivElement>(null);
	const breadcrumbRef = useRef<HTMLDivElement>(null);
	const { articleProperties, setArticleProperties } = PropertyServiceProvider.value;
	const isMobile = IsMobileService.value;

	const [isOverflow, setIsOverflow] = useState<boolean>(null);
	const [itemLink, setItemLink] = useState<ItemLink>(null);

	const pageData = PageDataContextService.value;
	const articleProps = ArticlePropsService.value;
	const isReadOnly = pageData?.conf.isReadOnly;
	const isTemplate = articleProps?.template?.length > 0;

	const resize = useCallback(() => {
		if (isReadOnly) return;
		const breadcrumb = breadcrumbRef.current;
		const properties = breadcrumb?.lastElementChild as HTMLElement;
		if (!properties) return;

		const width = breadcrumb?.clientWidth - properties.clientWidth - (linksRef.current?.clientWidth || 0);
		if (linksRef.current?.clientWidth > 0 && width < 20) setIsOverflow(true);
		else setIsOverflow(false);
	}, [breadcrumbRef.current]);

	const setNull = () => setIsOverflow(null);

	useEffect(() => {
		if (isReadOnly || isTemplate || isMobile) return;
		window.addEventListener("resize", setNull);
		return () => window.removeEventListener("resize", setNull);
	}, [itemLinks, articleProperties]);

	useEffect(() => {
		if (isReadOnly || isMobile) return;
		setNull();
	}, [itemLinks, articleProperties]);

	useLayoutEffect(() => {
		resize();
	}, [isOverflow]);

	useWatch(() => {
		const newItemLink = getArticleItemLink(itemLinks, articleProps.ref.path);
		setItemLink(newItemLink);
	}, [articleProps.ref.path]);

	const showArticleActions = !articleProps?.errorCode || articleProps?.errorCode === 500;

	return (
		<div ref={breadcrumbRef} className={classNames(className, { "next-line": isOverflow })}>
			<LinksBreadcrumb ref={linksRef} itemLinks={itemLinks} />
			{!isReadOnly && showArticleActions && (
				<>
					<div className="article-actions" data-qa="qa-article-actions">
						<NavigationDropdown
							className="article-actions"
							style={{ marginRight: "-2px" }}
							trigger={
								<Button variant="text" size="xs" className="p-0 h-full">
									<Icon code="ellipsis-vertical" style={{ fontSize: "1.7em" }} />
								</Button>
							}
						>
							<ItemMenu
								itemLink={itemLink}
								isCategory={itemLink?.type === ItemType.category}
								setItemLink={setItemLink}
							/>
						</NavigationDropdown>
					</div>
					<Properties
						properties={articleProperties}
						setProperties={setArticleProperties}
						hideList={isMobile}
					/>
				</>
			)}
		</div>
	);
};

export default styled(ArticleBreadcrumb)`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	${(p) => p.hasPreview && `& {width: 68%;}`}

	&.next-line {
		display: block;

		> :last-of-type {
			justify-content: end;
		}
	}

	.article-actions {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: end;
		right: 0;
		bottom: -1em;
		margin-right: 4px;
		z-index: var(--z-index-foreground);
		opacity: var(--opacity-darken-element);
	}

	.article-actions i {
		font-size: 22px;
	}

	.article-actions:hover {
		opacity: var(--opacity-active-element);
	}

	${cssMedia.narrow} {
		margin-bottom: 0.25rem;
	}

	@media print {
		display: none;
	}
`;
