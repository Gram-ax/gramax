import Tooltip from "@components/Atoms/Tooltip";
import { classNames } from "@components/libs/classNames";
import ButtonLink from "@components/Molecules/ButtonLink";
import useElementExistence from "@core-ui/hooks/useElementExistence";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import Tippy from "@tippyjs/react";
import {
	ReactElement,
	ReactNode,
	RefObject,
	createElement,
	forwardRef,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { Instance, Props } from "tippy.js";

export interface PopupMenuLayoutProps {
	isOpen?: boolean;
	children: ReactElement<any> | ReactElement<any>[];
	trigger?: JSX.Element | JSX.Element[];
	openTrigger?: string;
	appendTo?: Element | "parent" | ((ref: Element) => Element);
	isInline?: boolean;
	offset?: Props["offset"];
	placement?: Props["placement"];
	tooltipText?: string;
	onOpen?: () => void;
	onClose?: (instance: Instance<Props>) => false | void;
	onTippyMount?: (instance: Instance<Props>) => void;
	onClickOutside?: (instance: Instance<Props>, event: Event) => void;
	className?: string;
	disabled?: boolean;
	hideOnClick?: boolean;
	buttonClassName?: string;
	resetMaxHeight?: boolean;
	popperOptions?: Props["popperOptions"];
}

interface PopupProps {
	className: string;
	onClick: () => void;
	onClickCapture: () => void;
	isOpen: boolean;
	children: ReactNode;
}

const Popup = ({ className, onClick, isOpen, children }: PopupProps) => {
	const keydownHandler = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) onClick();
		},
		[isOpen],
	);

	useEffect(() => {
		if (!isOpen) return;
		document.addEventListener("keydown", keydownHandler);

		return () => document.removeEventListener("keydown", keydownHandler);
	}, [isOpen]);

	return (
		<div className={className} onClickCapture={onClick}>
			{children}
		</div>
	);
};

interface PopupMenuElementProps {
	IconElement: ReactNode;
	isInline?: boolean;
	tooltipText?: string;
	className?: string;
}

const PopupMenuElementUnstyled = (props: PopupMenuElementProps) => {
	const { IconElement, isInline = false, tooltipText, className } = props;

	const Element = tooltipText ? (
		<Tooltip content={tooltipText}>
			<span>{IconElement}</span>
		</Tooltip>
	) : (
		IconElement
	);

	return createElement(
		isInline ? "span" : "div",
		{
			className: classNames("button", {}, [className]),
			style: isInline ? {} : { display: "flex", alignItems: "center" },
		},
		Element,
	);
};

export const PopupMenuElement = styled(PopupMenuElementUnstyled)`
	${(p) => (p.isInline ? "" : PopupMenuElementStyle)}
`;
const PopupMenuLayout = forwardRef((props: PopupMenuLayoutProps, ref: RefObject<HTMLDivElement>) => {
	const {
		offset,
		children,
		trigger,
		appendTo,
		isInline = false,
		tooltipText,
		onOpen,
		onClose,
		onClickOutside,
		onTippyMount,
		placement = "bottom-start",
		className,
		disabled,
		openTrigger = "click",
		hideOnClick = true,
		isOpen: isOpenProp,
		buttonClassName,
		popperOptions,
	} = props;

	const currentRef = ref || useRef<Element>();
	const exists = useElementExistence(currentRef);

	const [isOpen, setIsOpen] = useState(isOpenProp);

	const IconElement = trigger ?? <ButtonLink iconCode="ellipsis" />;

	const closeHandler = () => {
		setIsOpen(false);
	};

	const openHandler = () => {
		setIsOpen(true);
		if (onOpen) onOpen();
	};

	const handlePopupClick = () => {
		if (hideOnClick) closeHandler();
	};

	useEffect(() => {
		if (isOpen) setIsOpen(exists);
	}, [exists]);

	useEffect(() => {
		setIsOpen(isOpenProp);
	}, [isOpenProp]);

	const element = PopupMenuElementUnstyled({ isInline, tooltipText, IconElement, className: buttonClassName });

	return (
		<Tippy
			ref={currentRef}
			onMount={onTippyMount}
			onAfterUpdate={(instance) => {
				if (!isOpen) instance.hide();
			}}
			appendTo={appendTo}
			animation={null}
			interactive
			placement={placement}
			disabled={disabled}
			trigger={openTrigger}
			arrow={false}
			onClickOutside={onClickOutside}
			maxWidth="none"
			offset={offset}
			onShow={openHandler}
			onHide={(instance) => {
				closeHandler();
				if (onClose) return onClose(instance);
			}}
			content={
				<Popup
					onClick={handlePopupClick}
					onClickCapture={handlePopupClick}
					isOpen={isOpen}
					className={className}
				>
					{children}
				</Popup>
			}
			popperOptions={popperOptions}
		>
			{element}
		</Tippy>
	);
});

const PopupMenuElementStyle = css`
	width: 100%;
	display: flex;
	cursor: pointer;
	font-size: 14px;
	font-weight: 300;
	line-height: 120%;
	-webkit-box-align: center;
	align-items: center;
	text-decoration: none;
	padding: 0.46rem 0.9rem;
	color: var(--color-primary-general);
	margin: 0 !important;
	white-space: nowrap;
`;

export default styled(PopupMenuLayout)`
	${(p) =>
		p.disabled
			? `opacity: 0.4;
			cursor: default;`
			: `	> div:hover {
				background: var(--color-menu-bg);

				svg,
				span {
					user-select: none;
					color: var(--color-primary);
				}
			}`}
	${(p) => (p.resetMaxHeight ? "" : "max-height: 40vh;")}
	margin: -10px 0px 0px;
	min-width: 0;
	font-size: 13px;
	z-index: var(--z-index-popover);
	overflow: hidden;
	border-radius: var(--radius-large);
	background: var(--color-article-bg);
	left: 0 !important;
	box-shadow: var(--menu-tooltip-shadow) !important;
	overflow-y: auto;

	white-space: nowrap;
	.divider {
		padding: 0;
		height: 0;
		border-bottom: 0.5px solid var(--color-line);
		opacity: 0.5;
	}
	div.disabled:hover {
		background: none;
	}

	> div,
	.popup-button {
		${PopupMenuElementStyle}
	}
`;
