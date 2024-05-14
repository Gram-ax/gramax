import styled from "@emotion/styled";
import { Placement } from "@popperjs/core";
import Tippy from "@tippyjs/react";
import { ReactNode, createElement, useCallback, useEffect, useState } from "react";
import Icon from "../Atoms/Icon";
import Tooltip from "../Atoms/Tooltip";

export interface PopupMenuLayoutProps {
	children: JSX.Element | JSX.Element[];
	trigger?: JSX.Element | JSX.Element[];
	appendTo?: Element | "parent" | ((ref: Element) => Element);
	isInline?: boolean;
	bottomOffset?: number;
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

const Popup = ({ className, onClick, onClickCapture, isOpen, children }: PopupProps) => {
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
		<div className={className} onClick={onClick} onClickCapture={onClickCapture}>
			{children}
		</div>
	);
};

const PopupMenuLayout = (props: PopupMenuLayoutProps) => {
	const {
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
	} = props;
	const [isOpen, setIsOpen] = useState(false);

	const IconElement = trigger ?? (
		<Icon code="ellipsis" isAction />
	);

	const closeHandler = () => {
		setIsOpen(false);
	};

	const openHandler = () => {
		setIsOpen(true);
		onOpen();
	};

	return (
		<Tippy
			onAfterUpdate={(instance) => {
				if (!isOpen) instance.hide();
			}}
			appendTo={appendTo}
			animation={null}
			interactive
			placement={placement}
			disabled={disabled}
			trigger="click"
			arrow={false}
			maxWidth="none"
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
	margin: ${(p) => p.bottomOffset ?? -10}px 0px 0px;
	min-width: 0;
	font-size: 13px;
	overflow: hidden;
	border-radius: 0.34rem;
	background: var(--color-article-bg);
	left: 0 !important;
	box-shadow: var(--menu-tooltip-shadow) !important;

	> div,
	.popup-button {
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
