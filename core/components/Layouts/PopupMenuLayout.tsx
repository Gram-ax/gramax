import styled from "@emotion/styled";
import Tippy from "@tippyjs/react";
import React, { Children, useEffect, useState } from "react";
import Icon from "../Atoms/Icon";
import Tooltip from "../Atoms/Tooltip";

const PopupMenuLayout = styled(
	({
		children,
		trigger,
		appendTo,
		isInline = false,
		tooltipText,
		open,
		onOpen,
		onClose,
		className,
	}: {
		children: JSX.Element | JSX.Element[];
		trigger?: JSX.Element | JSX.Element[];
		appendTo?: Element | "parent" | ((ref: Element) => Element);
		isInline?: boolean;
		bottomOffset?: number;
		tooltipText?: string;
		open?: boolean;
		onOpen?: () => void;
		onClose?: () => void;
		className?: string;
	}) => {
		const [isOpen, setIsOpen] = useState(false);
		const IconElement = trigger ?? (
			<Icon style={{ fontSize: "var(--big-icon-size)", fontWeight: "300" }} code="ellipsis-h" isAction />
		);

		useEffect(() => {
			const keydownHandler = (e: KeyboardEvent) => {
				if (e.key === "Escape" && isOpen) setIsOpen(false);
			};

			document.addEventListener("keydown", keydownHandler);

			return () => {
				document.removeEventListener("keydown", keydownHandler);
			};
		});

		useEffect(() => {
			setIsOpen(open);
		}, [open]);

		return (
			<Tippy
				onAfterUpdate={(instance) => {
					if (!isOpen) {
						instance.hide();
					}
				}}
				appendTo={appendTo}
				animation={null}
				interactive
				placement="bottom-start"
				trigger="click"
				arrow={false}
				maxWidth="none"
				onShow={() => {
					setIsOpen(true);
					if (onOpen) onOpen();
				}}
				onHide={() => {
					setIsOpen(false);
					if (onClose) onClose();
				}}
				content={
					<div className={className} onClick={() => setIsOpen(false)} onClickCapture={() => setIsOpen(false)}>
						{children}
					</div>
				}
			>
				{React.createElement(
					isInline ? "span" : "div",
					{ className: "button" },
					tooltipText ? (
						<Tooltip content={tooltipText}>
							<div>{IconElement}</div>
						</Tooltip>
					) : (
						IconElement
					),
				)}
			</Tippy>
		);
	},
)`
	margin: ${(p) => p.bottomOffset ?? -10}px 0px 0px;
	min-width: 0px;
	font-size: 13px;
	overflow: hidden;
	padding: ${(p) => (Children.count(p.children) > 1 ? "0.3rem" : "")} 0px;
	border-radius: 0.34rem;
	background: var(--color-article-bg);
	left: 0px !important;
	box-shadow: var(--menu-tooltip-shadow) !important;

	> div {
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
		margin: 0px !important;
	}
	> div:hover {
		background: var(--color-menu-bg);
	}
`;

export default PopupMenuLayout;
