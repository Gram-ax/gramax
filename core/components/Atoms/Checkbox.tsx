import styled from "@emotion/styled";
import { Property } from "csstype";
import { useEffect, useRef, useState } from "react";

const Checkbox = styled(
	({
		children,
		checked,
		disabled,
		interactive,
		borderClickArea = 4,
		onChange,
		onClick,
		overflow,
		className,
	}: {
		children?: React.ReactNode;
		checked?: boolean;
		disabled?: boolean;
		interactive?: boolean;
		borderClickArea?: number;
		onChange?: (isChecked: boolean) => void;
		onClick?: (isChecked: boolean) => void;
		overflow?: Property.Overflow;
		className?: string;
	}) => {
		const [currentChecked, setCurrentChecked] = useState(checked ?? false);
		const [checkboxSize, setCheckboxSize] = useState<number>(null);
		const checkboxRef = useRef<HTMLInputElement>(null);

		const currentOnClick = () => {
			if (disabled) return;
			if (onClick) onClick(!currentChecked);
			setCurrentChecked(!currentChecked);
		};

		useEffect(() => {
			setCheckboxSize(checkboxRef.current.getBoundingClientRect().width);
		}, []);

		useEffect(() => {
			if (typeof checked === "boolean") setCurrentChecked(checked);
		}, [checked]);

		useEffect(() => {
			if (onChange) onChange(currentChecked);
		}, [currentChecked]);

		const borderAreaDiv = (
			<div
				className="border-click-area"
				onClick={children ? (interactive ? currentOnClick : null) : currentOnClick}
				style={{
					cursor: "pointer",
					position: "absolute",
					width: checkboxSize + borderClickArea * 2,
					height: checkboxSize + borderClickArea * 2,
					transform: children
						? `translate(-${borderClickArea}px, 0)`
						: `translate(-${borderClickArea}px, -${borderClickArea}px)`,
				}}
			/>
		);

		if (!children)
			return (
				<span>
					{borderAreaDiv}
					<span className={className + " checkbox-layout"}>
						<input
							ref={checkboxRef}
							type="checkbox"
							className="atom-checkbox"
							checked={currentChecked}
							onChange={() => null}
						/>
					</span>
				</span>
			);

		return (
			<div className={className + " checkbox-layout"}>
				<div onClick={interactive ? null : currentOnClick}>
					{borderAreaDiv}
					<input
						disabled={disabled}
						type="checkbox"
						className="atom-checkbox"
						checked={currentChecked}
						ref={checkboxRef}
						onChange={() => null}
					/>
					<span style={{ userSelect: interactive ? null : "none", overflow: overflow ?? null }}>
						{children}
					</span>
				</div>
			</div>
		);
	},
)`
	${(p) => {
		const style = `display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-direction: row;
		justify-content: flex-start;
		${p.interactive ? "" : "cursor: pointer;"}`;

		return p.children ? `> div {${style}}` : style;
	}}

	.atom-checkbox {
		cursor: pointer;
		border: none;
		outline: none;
		color: inherit;
		font-size: inherit;
		font-weight: inherit;
		background: none;
	}
`;

export default Checkbox;
