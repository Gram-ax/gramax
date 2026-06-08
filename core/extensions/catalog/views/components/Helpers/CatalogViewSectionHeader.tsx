import styled from "@emotion/styled";
import type { HTMLAttributes } from "react";

type CatalogViewSectionHeaderProps = HTMLAttributes<HTMLDivElement>;

const Container = styled.div`
	&:not(:last-child) {
		margin-bottom: 0.5rem;
	}

	label {
		text-transform: uppercase;
		color: hsl(var(--muted));
		font-weight: 400;
		font-size: 0.75rem;
		line-height: 1rem;
	}
`;

export const CatalogViewSectionHeader = (props: CatalogViewSectionHeaderProps) => {
	return <Container className="flex gap-2 items-center w-full h-4" {...props} />;
};
