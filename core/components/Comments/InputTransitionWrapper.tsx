import styled from "@emotion/styled";
import { ReactElement } from "react";

const InputTransitionWrapper = styled(
	({
		children,
		className,
	}: {
		trigger: boolean;
		property: string;
		duration: string;
		children: JSX.Element | JSX.Element[];
		borderTop?: boolean;
		borderBottom?: boolean;
		className?: string;
	}): ReactElement => {
		return <div className={className}>{children}</div>;
	},
)`
	${(p) => {
		let padding = "padding: 0 !important;";
		const transition = `transition: ${p.property} ${p.duration};`;
		let margin = "margin-bottom: 1rem;";

		if (!p.trigger)
			return `
			${transition}
			${padding}
			`;

		if (p.borderTop && p.borderBottom) padding = "padding-top: 1rem !important;";
		else if (p.borderTop && !p.borderBottom) {
			margin = "";
		} else if (!p.borderTop && p.borderBottom) padding = "padding: 0 !important";

		return `
			${transition}
			${p.borderBottom ? "border-bottom: 0.1px solid var(--color-line-comment);" : ""}
			${margin}
			${padding}
			`;
	}}
`;

export default InputTransitionWrapper;
