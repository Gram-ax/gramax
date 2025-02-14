import LinksBreadcrumb from "@components/Breadcrumbs/LinksBreadcrumb";
import { classNames } from "@components/libs/classNames";
import { cssMedia } from "@core-ui/utils/cssUtils";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import Properties from "@ext/properties/components/Properties";
import { Property, PropertyValue } from "@ext/properties/models";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface ArticleBreadcrumbProps {
	className?: string;
	itemLinks: ItemLink[];
	hasPreview: boolean;
}

const ArticleBreadcrumb = ({ className, itemLinks }: ArticleBreadcrumbProps) => {
	const linksRef = useRef<HTMLDivElement>(null);
	const breadcrumbRef = useRef<HTMLDivElement>(null);
	const [isOverflow, setIsOverflow] = useState<boolean>(null);
	const [properties, setProperties] = useState<Property[] | PropertyValue[]>([]);
	const pageData = PageDataContextService.value;
	const isReadOnly = pageData?.conf.isReadOnly;

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
		window.addEventListener("resize", setNull);
		return () => window.removeEventListener("resize", setNull);
	}, [itemLinks, properties]);

	useEffect(() => {
		if (isReadOnly) return;
		setNull();
	}, [itemLinks, properties]);

	useLayoutEffect(() => {
		resize();
	}, [isOverflow]);

	return (
		<div ref={breadcrumbRef} className={classNames(className, { nextLine: isOverflow })}>
			<LinksBreadcrumb ref={linksRef} itemLinks={itemLinks} />
			{!isReadOnly && <Properties properties={properties} setProperties={setProperties} />}
		</div>
	);
};

export default styled(ArticleBreadcrumb)`
	display: flex;
	align-items: center;
	justify-content: space-between;
	${(p) => p.hasPreview && `& {width: 70%;}`}

	&.nextLine {
		display: block;

		> :last-of-type {
			justify-content: end;
		}
	}

	${cssMedia.narrow} {
		margin-bottom: 0.25rem;
	}
`;
