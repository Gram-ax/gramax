import { useGetCatalogLogoSrc } from "@core-ui/ContextServices/CatalogLogoService/catalogLogoHooks";
import type { SerializedStyles } from "@emotion/react";
// biome-ignore lint/style/noRestrictedImports: will be deleted in new sidebars
import styled from "@emotion/styled";
import IconComponent from "@ext/markdown/elements/icon/render/components/Icon";
import { forwardRef, type MutableRefObject, type ReactNode } from "react";

interface BreadcrumbCatalogProps {
	catalog: { name: string; title: ReactNode };
	variant?: SerializedStyles;
	className?: string;
}

const BreadcrumbCatalog = forwardRef((props: BreadcrumbCatalogProps, ref: MutableRefObject<HTMLDivElement>) => {
	const { catalog, className } = props;
	const { logo } = useGetCatalogLogoSrc(catalog?.name);

	return (
		<div className={className} ref={ref}>
			{logo &&
				("iconCode" in logo ? (
					<IconComponent code={logo.iconCode} color={logo.iconColor} />
				) : "emoji" in logo ? (
					<span>{logo.emoji}</span>
				) : (
					<img alt={catalog.name} src={logo.src} />
				))}
			<span className="title">{catalog.title}</span>
		</div>
	);
});

export default styled(BreadcrumbCatalog)`
	min-width: 0;
	display: flex;
	align-items: center;
	gap: 0.3rem;

	img {
		width: 100%;
		margin: 0px;
		max-width: 1rem;
		max-height: 1rem;
		box-shadow: none;
	}

	.title {
		font-size: 10px;
		font-weight: 600;
		white-space: nowrap;
	}

	${({ variant }) => variant}
`;
