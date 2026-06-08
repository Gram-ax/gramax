import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import isMobileService from "@core-ui/ContextServices/isMobileService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import styled from "@emotion/styled";
import { FragmentLinkHoverTooltip } from "@ext/markdown/elements/fragment-link/edit/logic/FragmentLinkHoverTooltip";
import { type ReactNode, useRef } from "react";

interface FragmentLinkProps {
	id: string;
	children?: ReactNode;
	className?: string;
}

const FragmentLink = styled(({ id, children, className }: FragmentLinkProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const catalogProps = useCatalogPropsStore((state) => state.data);
	const pageDataContext = PageDataContextService.value;
	const isMobile = isMobileService.value;
	const tooltipRef = useRef<FragmentLinkHoverTooltip | null>(null);

	const onMouseEnter = (event: React.MouseEvent<HTMLSpanElement>) => {
		if (isMobile) return;
		const el = event.currentTarget as HTMLElement;
		if (tooltipRef.current?.element === el) return;
		tooltipRef.current?.closeComponent();
		const tooltip = new FragmentLinkHoverTooltip(document.body, apiUrlCreator, pageDataContext, catalogProps);
		tooltip.onDestroy = () => {
			tooltipRef.current = null;
		};
		tooltip.setFragmentId(id, apiUrlCreator);
		tooltip.setComponent(el);
		tooltipRef.current = tooltip;
	};

	return (
		<span className={className} data-qa="fragment-link">
			<span className="fragmentLinkText" data-fragment-link={id} onMouseEnter={onMouseEnter}>
				{children}
			</span>
		</span>
	);
})`
	.fragmentLinkText {
		border-bottom: 1px dotted var(--color-article-text);
		cursor: help;
	}
`;

export default FragmentLink;
