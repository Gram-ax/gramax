import { useGetCatalogLogoSrc } from "@core-ui/ContextServices/CatalogLogoService/catalogLogoHooks";
import { SerializedStyles } from "@emotion/react";
import styled from "@emotion/styled";
import { forwardRef, MutableRefObject, ReactNode } from "react";

interface BreadcrumbCatalogProps {
	catalog: { name: string; title: ReactNode };
	variant?: SerializedStyles;
	className?: string;
}

const BreadcrumbCatalog = forwardRef((props: BreadcrumbCatalogProps, ref: MutableRefObject<HTMLDivElement>) => {
	const { catalog, className } = props;
	const { isExist, src } = useGetCatalogLogoSrc(catalog?.name);

	return (
		<div className={className} ref={ref}>
			{isExist && <img alt={catalog.name} src={src} />}
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
