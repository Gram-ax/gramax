import styled from "@emotion/styled";
import { HTMLAttributes } from "react";

const Code = styled(
	({
		children,
		className,
		...props
	}: { children: React.ReactNode; className?: string } & HTMLAttributes<HTMLPreElement>) => {
		return (
			<pre className={className} {...props}>
				<span>{children}</span>
			</pre>
		);
	},
)`
	box-decoration-break: clone;
	display: inline;
	padding: 0;
	white-space: pre-wrap;
	font-size: 12px;
	font-family: "Roboto Mono";
	font-weight: 400;
	line-height: 20px;
`;

export default Code;
