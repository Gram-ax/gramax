import { cn } from "@core-ui/utils/cn";
import styled from "@emotion/styled";
import { ReactNode } from "react";

const Caption = ({ children, className }: { children: ReactNode; className?: string }) => {
	return <em className={cn(className, "resource-caption")}>{children}</em>;
};

export default styled(Caption)`
	display: block;
	width: 100%;
	font-size: 0.8em;
	font-style: italic;
	margin-bottom: 1em;
	font-weight: 300;
	line-height: 1.4em;
	text-align: center;
	color: var(--color-image-title);
`;
