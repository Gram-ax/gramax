import LinksBreadcrumb from "@components/Breadcrumbs/LinksBreadcrumb";
import { classNames } from "@components/libs/classNames";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import Properties from "@ext/properties/components/Properties";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const ArticleBreadcrumb = ({ className, itemLinks }: { className?: string; itemLinks: ItemLink[] }) => {
	const linksRef = useRef<HTMLDivElement>(null);
	const breadcrumbRef = useRef<HTMLDivElement>(null);
	const articleProps = ArticlePropsService.value;
	const [isOverflow, setIsOverflow] = useState<boolean>(null);

	const resize = useCallback(() => {
		const breadcrumb = breadcrumbRef.current;
		const properties = breadcrumb?.lastElementChild as HTMLElement;
		if (!properties) return;

		const width = breadcrumb?.clientWidth - properties.clientWidth - (linksRef.current?.clientWidth || 0);
		if (linksRef.current?.clientWidth > 0 && width < 20) setIsOverflow(true);
		else setIsOverflow(false);
	}, [breadcrumbRef.current]);

	const setNull = () => setIsOverflow(null);

	useEffect(() => {
		window.addEventListener("resize", setNull);
		return () => window.removeEventListener("resize", setNull);
	}, [itemLinks, articleProps?.properties]);

	useWatch(() => {
		setNull();
	}, [itemLinks, articleProps?.properties]);

	useLayoutEffect(() => {
		resize();
	}, [isOverflow]);

	return (
		<div ref={breadcrumbRef} className={classNames(className, { nextLine: isOverflow })}>
			<LinksBreadcrumb ref={linksRef} itemLinks={itemLinks} />
			<Properties properties={articleProps.properties} />
		</div>
	);
};

export default styled(ArticleBreadcrumb)`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;

	&.nextLine {
		display: block;

		> :first-child {
			margin-bottom: 0.5em;
		}

		> :last-child {
			justify-content: end;
		}
	}
`;
