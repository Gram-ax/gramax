import ButtonLink from "@components/Molecules/ButtonLink";
import useElementExistence from "@core-ui/hooks/useElementExistence";
import styled from "@emotion/styled";
import { Placement } from "@popperjs/core";
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
import Tooltip from "../Atoms/Tooltip";
import { Instance, Props } from "tippy.js";

export interface PopupMenuLayoutProps {
	children: ReactElement<any> | ReactElement<any>[];
	trigger?: JSX.Element | JSX.Element[];
	openTrigger?: string;
	appendTo?: Element | "parent" | ((ref: Element) => Element);
	isInline?: boolean;
	offset?: [number, number];
	placement?: Placement;
	tooltipText?: string;
	onOpen?: () => void;
	onClose?: (instance: Instance<Props>) => void;
	onTippyMount?: (instance: Instance<Props>) => void;
	className?: string;
	disabled?: boolean;
	hideOnClick?: boolean;
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

const PopupMenuLayout = forwardRef((props: PopupMenuLayoutProps, ref: RefObject<HTMLDivElement>) => {
	const {
		offset,
		children,
		trigger,
		appendTo,
		isInline = false,
		tooltipText,
		onOpen = () => {},
		onClose = () => {},
		onTippyMount,
		placement = "bottom-start",
		className,
		disabled,
		openTrigger = "click",
		hideOnClick = true,
	} = props;

	const currentRef = ref || useRef<Element>();
	const exists = useElementExistence(currentRef);

	const [isOpen, setIsOpen] = useState(false);

	const IconElement = trigger ?? <ButtonLink iconCode="ellipsis" />;

	const closeHandler = () => {
		setIsOpen(false);
	};

	const openHandler = () => {
		setIsOpen(true);
		onOpen();
	};

	const handlePopupClick = () => {
		if (hideOnClick) closeHandler();
	};

	useEffect(() => {
		if (isOpen) setIsOpen(exists);
	}, [exists]);

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
			maxWidth="none"
			offset={offset}
			onShow={openHandler}
			onHide={(instance) => {
				closeHandler();
				onClose(instance);
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
		>
			{createElement(
				isInline ? "span" : "div",
				{ className: "button", style: { display: "flex", alignItems: "center" } },
				tooltipText ? (
					<Tooltip content={tooltipText}>
						<span>{IconElement}</span>
					</Tooltip>
				) : (
					IconElement
				),
			)}
		</Tippy>
	);
});

export default styled(PopupMenuLayout)`
	${(p) =>
		p.disabled
			? `opacity: 0.4;
			cursor: default;`
			: `	> div:hover {
				background: var(--color-menu-bg);

				i,
				span {
					user-select: none;
					color: var(--color-primary);
				}
			}`}
	margin: -10px 0px 0px;
	min-width: 0;
	font-size: 13px;
	overflow: hidden;
	border-radius: var(--radius-large);
	background: var(--color-article-bg);
	left: 0 !important;
	box-shadow: var(--menu-tooltip-shadow) !important;
	max-height: 40vh;
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
	}
`;
