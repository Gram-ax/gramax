import styled from "@emotion/styled";
import { useContext, useEffect, useState } from "react";
import { FocusPositionContext } from "../../core/edit/components/ContextWrapper";

const Focus = styled(
	({
		children,
		position,
		isMd,
		className,
	}: {
		children: JSX.Element;
		position: number;
		isMd?: boolean;
		className?: string;
	}) => {
		const focusPosition = useContext(FocusPositionContext);
		const [isFocus, setIsFocus] = useState(false);

		useEffect(() => {
			setIsFocus(focusPosition === position);
		}, [focusPosition]);

		if (isMd) {
			return (
				<span className={className} is-focus={`${isFocus}`}>
					{children}
				</span>
			);
		}

		return (
			<div className={className} is-focus={`${isFocus}`}>
				{children}
			</div>
		);
	},
)`
	user-select: none;
	-ms-user-select: none;
	-webkit-user-select: none;

	${(p) =>
		p.isMd
			? ``
			: `
	&[is-focus="false"] > * {
		pointer-events: none;
	}`}

	&[is-focus="true"] *[data-focusable="true"] {
		outline: 2px solid #0563d6;
	}
`;

export default Focus;
