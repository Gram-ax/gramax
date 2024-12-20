import Icon from "@components/Atoms/Icon";
import Input from "@components/Atoms/Input";
import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import { ChangeEvent, memo, MouseEvent, useCallback, useRef } from "react";

interface ActionInputProps {
	icon: string;
	tooltipText?: string;
	defaultValue?: string;
	placeholder?: string;
	onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
	className?: string;
}

const ActionInput = ({ icon, className, tooltipText, defaultValue, placeholder, onChange }: ActionInputProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const onClick = useCallback(() => {
		const input = inputRef.current;
		const isVisible = input?.classList.contains("visible");

		if (!isVisible) {
			input?.classList.add("visible");
			input?.focus();
		} else input?.classList.remove("visible");
	}, [inputRef.current]);

	const onInputClick = useCallback((event: MouseEvent<HTMLInputElement>) => {
		event.stopPropagation();
		event.preventDefault();
	}, []);

	return (
		<Tooltip content={tooltipText} delay={[500, 0]}>
			<div className={className} onClick={onClick}>
				<Icon code={icon} />
				<Input
					ref={inputRef}
					defaultValue={defaultValue}
					placeholder={placeholder}
					onChange={onChange}
					onClick={onInputClick}
				/>
			</div>
		</Tooltip>
	);
};

export default memo(styled(ActionInput)`
	display: flex;
	align-items: center;
	cursor: pointer;
	color: var(--color-primary-general);
	justify-content: center;

	i {
		padding: 7px 8px;
	}

	input {
		color: var(--color-primary);
		padding: 0 0;
		border: 0;
		font-size: 1em;
		transition: max-width 0.1s ease-in-out;
		max-width: 0;
		height: 100%;
	}

	input:hover {
		color: var(--color-primary);
	}

	&:hover {
		color: var(--color-primary);
	}

	.visible {
		max-width: 10em;
		margin-right: 0.5em;
	}
`);
