import type { ReactNode } from "react";

interface HTMLFragmentLinkProps {
	id?: string;
	children?: ReactNode;
}

const HTMLFragmentLink = ({ id, children }: HTMLFragmentLinkProps) => <span data-fragment-link={id}>{children}</span>;

export default HTMLFragmentLink;
