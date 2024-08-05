import Button, { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { ChangeEventHandler, ForwardedRef, HTMLProps, forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import Icon from "../Atoms/Icon";
import Input from "../Atoms/Input";

export interface SearchElement extends HTMLDivElement {
	inputRef: HTMLInputElement;
	chevronRef: HTMLDivElement;
}

interface ConfigProps {
	isOpen: boolean;
	disable?: boolean;
	isCode?: boolean;
	isErrorValue?: boolean;
}

interface SearchProps extends ConfigProps, HTMLProps<HTMLInputElement> {
	onSearchChange?: (value: string) => void;
	setValue: (value: string) => void;
	onChevronClick?: () => void;
	value: string;
	icon?: string;
	errorText?: string;
	showErrorText?: boolean;
	tabIndex?: number;
}

const Search = forwardRef((props: SearchProps, ref: ForwardedRef<SearchElement>) => {
	const { isOpen, value, icon, disable, tabIndex, errorText, showErrorText, className } = props;
	const { placeholder, title = t("search.placeholder") } = props;
	const { onClick, onChevronClick, onSearchChange, setValue, onFocus } = props;

	const inputRef = useRef<HTMLInputElement>(null);
	const searchRef = useRef<HTMLDivElement>(null);
	const chevronRef = useRef<HTMLDivElement>(null);

	useImperativeHandle(ref, () => ({
		get inputRef(): HTMLInputElement {
			return inputRef.current;
		},
		get chevronRef(): HTMLDivElement {
			return chevronRef.current;
		},
		...searchRef.current,
	}));

	useEffect(() => {
		if (disable) inputRef.current?.blur();
	}, [disable]);

	const onChangeHandler: ChangeEventHandler<HTMLInputElement> = (e) => {
		setValue(e.target.value);
		onSearchChange?.(e.target.value);
	};

	return (
		<div className={classNames("search", {}, [className])}>
			<div className="list-search" ref={searchRef}>
				{icon && (
					<div className="left-icon">
						<Icon code={icon} />
					</div>
				)}
				<div className="list-input" onClick={onClick}>
					<Input
						style={{ paddingRight: "2px" }}
						title={title}
						dataQa={placeholder}
						tabIndex={tabIndex}
						showErrorText={showErrorText}
						errorText={errorText}
						ref={inputRef}
						value={value}
						onChange={onChangeHandler}
						placeholder={placeholder}
						onFocus={onFocus}
					/>
				</div>
				<div className={"chevron-icon"} onClick={onChevronClick} ref={chevronRef}>
					<Button textSize={TextSize.S} buttonStyle={ButtonStyle.transparentInverse}>
						<Icon code={`chevron-${isOpen ? "up" : "down"}`} />
					</Button>
				</div>
			</div>
		</div>
	);
});

export default styled(Search)`
	${(p) => (p.disable ? "pointer-events: none;" : "")}
	${(p) =>
		p.isCode
			? `
	outline: 0;
	width: 100%;
	height: 34px;
	border: none;
	display: flex;
	font-size: 14px;
	font-weight: 300;
	padding: 6px 12px;
	border-radius: var(--radius-normal);
	background: var(--color-code-bg);
	color: var(--color-article-heading-text);`
			: ""}

	.list-search {
		display: flex;
		align-items: center;
		width: 100%;

		.left-icon i {
			padding-right: 8px;
			font-size: 13px;
		}

		.list-input {
			width: 100%;
			font-size: 14px;
		}
	}

	.chevron-icon {
		i:hover {
			font-weight: 800 !important;
		}
	}
`;
