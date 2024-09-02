import ButtonLink from "@components/Molecules/ButtonLink";
import useElementExistence from "@core-ui/hooks/useElementExistence";
import styled from "@emotion/styled";
import { Placement } from "@popperjs/core";
import Tippy from "@tippyjs/react";
import { ReactNode, createElement, useCallback, useEffect, useRef, useState, ReactElement } from "react";
import Tooltip from "../Atoms/Tooltip";

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
	onClose?: () => void;
	className?: string;
	disabled?: boolean;
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

const PopupMenuLayout = (props: PopupMenuLayoutProps) => {
	const {
		offset,
		children,
		trigger,
		appendTo,
		isInline = false,
		tooltipText,
		onOpen = () => {},
		onClose = () => {},
		placement = "bottom-start",
		className,
		disabled,
		openTrigger = "click",
	} = props;

	const ref = useRef<Element>();
	const exists = useElementExistence(ref);

	const [isOpen, setIsOpen] = useState(false);

	const IconElement = trigger ?? <ButtonLink iconCode="ellipsis" />;

	const closeHandler = () => {
		setIsOpen(false);
	};

	const openHandler = () => {
		setIsOpen(true);
		onOpen();
	};

	useEffect(() => {
		if (isOpen) setIsOpen(exists);
	}, [exists]);

	return (
		<Tippy
			ref={ref}
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
			onHide={() => {
				closeHandler();
				onClose();
			}}
			content={
				<Popup onClick={closeHandler} onClickCapture={closeHandler} isOpen={isOpen} className={className}>
					{children}
				</Popup>
			}
		>
			{createElement(
				isInline ? "span" : "div",
				{ className: "button" },
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
};

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

	.divider {
		padding: 0;
		height: 0;
		border-bottom: 0.5px solid var(--color-line);
		opacity: 0.5;
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
	}

	> div:hover,
	.popup-button:hover {
		background: var(--color-menu-bg);

		i,
		span {
			user-select: none;
			color: var(--color-primary);
		}
	}
`;
