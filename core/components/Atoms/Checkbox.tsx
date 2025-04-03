import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { Property } from "csstype";
import { ReactNode, useEffect, useRef, useState } from "react";

interface CheckboxProps {
	children?: ReactNode;
	checked?: boolean;
	disabled?: boolean;
	interactive?: boolean;
	indeterminate?: boolean;
	borderClickArea?: number;
	onChange?: (isChecked: boolean) => void;
	onClick?: (isChecked: boolean, e: React.MouseEvent<HTMLDivElement>) => void;
	overflow?: Property.Overflow;
	readOnly?: boolean;
	className?: string;
}

const Checkbox = (props: CheckboxProps) => {
	const {
		children,
		checked,
		disabled,
		interactive,
		indeterminate = false,
		borderClickArea = 4,
		onChange,
		onClick,
		overflow,
		className,
		readOnly,
	} = props;
	const [currentChecked, setCurrentChecked] = useState(checked ?? false);
	const [checkboxSize, setCheckboxSize] = useState<number>(null);
	const checkboxRef = useRef<HTMLInputElement>(null);

	const currentOnClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (disabled) return;
		if (onClick) onClick(!currentChecked, e);
		setCurrentChecked(!currentChecked);
	};

	useEffect(() => {
		setCheckboxSize(checkboxRef.current.getBoundingClientRect().width);
	}, []);

	useEffect(() => {
		setCurrentChecked(Boolean(checked));
	}, [checked]);

	useEffect(() => {
		if (onChange) onChange(currentChecked);
	}, [currentChecked]);

	useEffect(() => {
		checkboxRef.current.indeterminate = indeterminate;
	}, [indeterminate]);

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
				<span className={classNames(className, {}, ["checkbox-layout"])}>
					<input
						ref={checkboxRef}
						type="checkbox"
						className="atom-checkbox"
						checked={currentChecked}
						onChange={() => null}
						readOnly={readOnly}
					/>
				</span>
			</span>
		);

	return (
		<div className={classNames(className, {}, ["checkbox-layout"])}>
			<div onClick={interactive ? null : currentOnClick}>
				{borderAreaDiv}
				<input
					disabled={disabled}
					type="checkbox"
					className="atom-checkbox"
					checked={currentChecked}
					ref={checkboxRef}
					onChange={() => null}
					readOnly={readOnly}
				/>
				<span style={{ userSelect: interactive ? null : "none", overflow }}>{children}</span>
			</div>
		</div>
	);
};

export default styled(Checkbox)`
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
