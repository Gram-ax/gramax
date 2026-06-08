import { cn } from "@core-ui/utils/cn";
import styled from "@emotion/styled";
import type { HTMLAttributes } from "react";

type CatalogViewSectionProps = HTMLAttributes<HTMLDivElement>;

const Container = styled.div`
	padding-bottom: 0.25rem;
`;

export const CatalogViewSection = ({ className, ...props }: CatalogViewSectionProps) => {
	return <Container className={cn("p-3 w-full", className)} {...props} />;
};
