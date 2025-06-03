import Button, { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import { classNames } from "@components/libs/classNames";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import {
	ChangeEventHandler,
	ForwardedRef,
	HTMLProps,
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
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
	disableCancelAction?: boolean;
}

interface SearchProps extends ConfigProps, HTMLProps<HTMLInputElement> {
	onSearchChange?: (value: string) => void;
	setValue: (value: string) => void;
	onChevronClick?: () => void;
	setIsOpen: (value: boolean) => void;
	value: string;
	icon?: string;
	errorText?: string;
	onCancelClick?: () => void;
	showErrorText?: boolean;
	tabIndex?: number;
}

const inputClassName =
	"h-10 w-full rounded-lg border border-secondary-border bg-secondary-bg px-3 py-2.5 shadow-sm outline-none transition-all lg:h-9 lg:py-2 font-sans text-sm text-primary-fg placeholder:text-muted hover:border-primary-border hover:shadow-base focus:rounded-lg focus:border focus:border-secondary-border focus:bg-secondary-bg focus:shadow-focus read-only:border-primary-border read-only:shadow-sm  read-only:focus:bg-secondary-bg-hover disabled:border-primary-border disabled:bg-secondary-bg-hover disabled:shadow-sm invalid:border-status-error-secondary-border invalid:shadow-base invalid:hover:border-status-error-primary-border invalid:hover:shadow-base invalid:focus:border-status-error-secondary-border invalid:focus:shadow-focus-error aria-[invalid=true]:border-status-error-secondary-border aria-[invalid=true]:shadow-base aria-[invalid=true]:hover:border-status-error-primary-border aria-[invalid=true]:hover:shadow-base aria-[invalid=true]:focus:border-status-error-secondary-border aria-[invalid=true]:focus:shadow-focus-error";

const Search = forwardRef((props: SearchProps, ref: ForwardedRef<SearchElement>) => {
	const { isOpen, value, icon, disable, tabIndex, errorText, showErrorText, disableCancelAction, className } = props;
	const { placeholder, title = t("search.placeholder") } = props;
	const { onClick, onChevronClick, onSearchChange, setValue, setIsOpen, onCancelClick, onFocus } = props;
	const [instantFocus, setInstantFocus] = useState(false);

	const instantFocusDriver = useDebounce(() => setInstantFocus(false), 150);
	const inputRef = useRef<HTMLInputElement>(null);
	const searchRef = useRef<HTMLDivElement>(null);
	const chevronRef = useRef<HTMLDivElement>(null);

	const dataQa = props["data-qa"];

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
		if (value.length === 0 && !isOpen) {
			setIsOpen(true);
		}
	};
	const onCancelHandler = () => {
		onCancelClick?.();
		setValue("");
		onSearchChange?.("");

		instantFocusDriver.cancel();
		if (instantFocus) {
			inputRef.current?.focus();
			setIsOpen(true);
		} else {
			inputRef.current?.focus();
		}
	};
	const onFocusHandler: React.FocusEventHandler<HTMLInputElement> = (e) => {
		onFocus(e);
	};

	const [focus, setIsFocus] = useState(false);

	return (
		<div
			className={classNames("search", { "input-with-focus": focus }, [className, inputClassName])}
			onFocus={() => {
				setIsFocus(true);
			}}
			onBlur={() => {
				setIsFocus(false);
			}}
		>
			<div className="list-search" ref={searchRef}>
				{icon && (
					<div className="left-icon">
						<Icon code={icon} />
					</div>
				)}
				<div className="list-input" onClick={onClick}>
					<Input
						className={"input-component"}
						title={title}
						dataQa={dataQa ?? placeholder}
						tabIndex={tabIndex}
						showErrorText={showErrorText}
						errorText={errorText}
						ref={inputRef}
						value={value}
						onChange={onChangeHandler}
						placeholder={placeholder}
						onFocus={onFocusHandler}
						onBlur={() => {
							setInstantFocus(true);
							instantFocusDriver.start();
						}}
					/>
				</div>
				{!disableCancelAction && typeof onCancelClick === "function" && (
					<div
						className={classNames("x-icon", { isValue: Boolean(value), isOpen }, ["custom-action"])}
						onClick={onCancelHandler}
						ref={chevronRef}
					>
						<Button textSize={TextSize.XS} buttonStyle={ButtonStyle.transparent}>
							<Icon code={"x"} />
						</Button>
					</div>
				)}
				<div className={"custom-action"} onClick={onChevronClick} ref={chevronRef}>
					<Button textSize={TextSize.S} buttonStyle={ButtonStyle.transparent}>
						<Icon code={`chevron-${isOpen ? "up" : "down"}`} />
					</Button>
				</div>
			</div>
		</div>
	);
});

export default styled(Search)`
	background: transparent;
	padding-left: 13px;
	font-weight: 400;
	font-size: 0.875rem;
	line-height: 1.25rem;
	border-radius: 0.5rem;
	color: hsl(var(--primary-fg));
	border: 1px solid hsl(var(--secondary-border)) !important;
	padding-top: 0.5rem;
	padding-bottom: 0.5rem;
	box-shadow: none;

	:hover {
		--tw-shadow: 0px 1px 3px 0px rgba(15, 23, 42, 0.1), 0px 1px 2px 0px rgba(15, 23, 42, 0.06);
		--tw-shadow-colored: 0px 1px 3px 0px var(--tw-shadow-color), 0px 1px 2px 0px var(--tw-shadow-color);
		box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow) !important;
	}

	.textInput::placeholder {
		color: hsl(var(--muted));
	}

	&.input-with-focus {
		--tw-shadow: 0px 0px 0px 1px hsl(var(--tertiary-accent));
		--tw-shadow-colored: 0px 0px 0px 1px var(--tw-shadow-color);
		box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
	}

	outline: 2px solid transparent;
	outline-offset: 2px;

	.list-search {
		display: flex;
		align-items: center;
		width: 100%;
		flex-direction: row;
		gap: 0.428em;

		.left-icon i {
			padding-right: 0.57em;
			font-size: 0.9em;
		}

		.list-input {
			width: 100%;
			font-size: 1em;
		}

		:hover {
			.x-icon {
				opacity: 1;
			}
		}

		.isOpen {
			opacity: 1;
		}

		.x-icon:not(.isValue) {
			opacity: 0;
			cursor: default;
			pointer-events: none;
		}
	}

	.x-icon {
		opacity: 0;
	}
`;
