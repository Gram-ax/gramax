import styled from "@emotion/styled";
import { useContext, useEffect, useState } from "react";
import { FocusPositionContext } from "../../core/edit/components/ContextWrapper";

const Focus = styled(
	({
		children,
		position,
		isInline,
		className,
	}: {
		children: JSX.Element;
		position: number;
		isInline?: boolean;
		className?: string;
	}) => {
		const focusPosition = useContext(FocusPositionContext);
		const [isFocus, setIsFocus] = useState(false);

		useEffect(() => {
			setIsFocus(focusPosition === position);
		}, [focusPosition]);

		if (isInline) {
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

	&[is-focus="false"] > * {
		pointer-events: none;
	}

	&[is-focus="true"] *[data-focusable="true"] {
		outline: 2px solid #0563d6;
	}
`;

export default Focus;
