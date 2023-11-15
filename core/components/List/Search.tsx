import styled from "@emotion/styled";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import useLocalize from "../../extensions/localization/useLocalize";
import Icon from "../Atoms/Icon";
import Input from "../Atoms/Input";

export type SearchElement = HTMLDivElement & { inputRef: HTMLInputElement; chevronRef: HTMLDivElement };

const Search = styled(
	forwardRef(
		(
			{
				isOpen,
				placeholder = useLocalize("searchPlaceholder"),
				value,
				icon,
				disable,
				tabIndex,
				isErrorValue,
				onClick,
				onChevronClick,
				onSearchChange,
				setValue,
				onFocus,
				className,
			}: {
				isOpen: boolean;
				placeholder?: string;
				value?: string;
				icon?: string;
				disable?: boolean;
				tabIndex?: number;
				isCode?: boolean;
				isErrorValue?: boolean;
				onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
				onChevronClick?: (isOpen: boolean) => void;
				onSearchChange?: (value: string) => void;
				setValue?: (value: string) => void;
				onFocus?: () => void;
				className?: string;
			},
			ref?: React.MutableRefObject<SearchElement>,
		) => {
			const searchRef = useRef<HTMLDivElement>(null);
			const inputRef = useRef<HTMLInputElement>(null);
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
				if (disable) inputRef.current.blur();
			}, [disable]);

			useEffect(() => {
				if (!value && value !== "") return;
			}, [value]);

			return (
				<div className={"search " + className}>
					<div className="list-search" ref={searchRef}>
						{icon ? (
							<div className="left-icon">
								<Icon faFw code={icon} />
							</div>
						) : null}
						<div className="list-input" onClick={onClick}>
							<Input
								tabIndex={tabIndex}
								isInputInvalid={isErrorValue}
								ref={inputRef}
								value={value}
								onChange={(e) => {
									setValue(e.target.value);
									if (onSearchChange) onSearchChange(e.target.value);
								}}
								placeholder={placeholder}
								onFocus={onFocus}
							/>
						</div>
						<div className="chevron-icon" onClick={() => onChevronClick(isOpen)} ref={chevronRef}>
							<Icon
								code={`chevron-${!isOpen ? "down" : "up"}`}
								style={{ fontSize: "10px", fontWeight: 300, cursor: "pointer" }}
							/>
						</div>
					</div>
				</div>
			);
		},
	),
)`
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
	border-radius: 4px;
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

export default Search;
