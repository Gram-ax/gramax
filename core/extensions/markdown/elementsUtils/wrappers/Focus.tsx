import styled from "@emotion/styled";
import { useContext, useEffect, useState } from "react";
import { FocusPositionContext } from "../../core/edit/components/ContextWrapper";

interface FocusProps {
	children: JSX.Element;
	getPos: () => number;
	isMd?: boolean;
	className?: string;
}

const Focus = ({ children, getPos, isMd, className }: FocusProps) => {
	const focusPosition = useContext(FocusPositionContext);
	const [isFocus, setIsFocus] = useState(false);
	useEffect(() => {
		setIsFocus(focusPosition === getPos());
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
};

export default styled(Focus)`
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
		outline: 2px solid var(--color-focus);
		outline-offset: -2px;
	}
`;
