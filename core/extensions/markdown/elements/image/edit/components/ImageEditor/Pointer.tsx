"use client";

import React, { useState, useRef, useEffect, RefObject } from "react";
import { ImageObjectTypes, PointerObject } from "../../model/imageEditorTypes";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import Input from "@components/Atoms/Input";
import styled from "@emotion/styled";
import useLocalize from "@ext/localization/useLocalize";
import Icon from "@components/Atoms/Icon";

const Pointer = (
	props: PointerObject & {
		parentRef: RefObject<HTMLDivElement>;
		editable: boolean;
		index: number;
		selected: boolean;
		className?: string;
		style?;
	},
) => {
	const {
		index,
		type,
		direction,
		x,
		y,
		scale,
		editable,
		color,
		selected,
		onClick,
		changeData,
		parentRef,
		className,
		style,
	} = props;
	const mainRef = useRef<HTMLDivElement>(null);

	const [position, setPosition] = useState({ left: 0, top: 0 });
	const [pColor, setPColor] = useState<string>(color);
	const [curDirection, setDireciton] = useState<string>(direction);
	const [isSelected, setSelected] = useState<boolean>(selected);

	const messages = [
		useLocalize("delete"),
		useLocalize("topLeftPointer"),
		useLocalize("topRightPointer"),
		useLocalize("bottomLeftPointer"),
		useLocalize("bottomRightPointer"),
	];

	const data: PointerObject = {
		type: type,
		x: x,
		y: y,
		direction: direction,
		scale: scale,
		color: color,
	};

	useEffect(() => {
		setPosition({ left: x, top: y });
		setSelected(selected);
		setPColor(color);
		setDireciton(direction);

		if (selected) onClick([mainRef.current, index]);
	}, [x, y, selected, color, direction]);

	const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = (event) => {
		if (!editable || !mainRef.current) return false;

		if (onClick && !onClick([mainRef.current, index])) return false;

		const curElement = mainRef.current;
		const parentContainer = parentRef.current;
		const containerRect = parentContainer?.getBoundingClientRect();

		const offsetX = event.clientX - curElement.getBoundingClientRect().left;
		const offsetY = event.clientY - curElement.getBoundingClientRect().top;

		const startX = event.clientX - containerRect.left - offsetX;
		const startY = event.clientY - containerRect.top - offsetY;

		const onMouseMove = (e: MouseEvent) => {
			const x = e.clientX - containerRect.left - offsetX;
			const y = e.clientY - containerRect.top - offsetY;

			const elementWidthPercent = (curElement.offsetWidth / containerRect.width) * 100;
			const elementHeightPercent = (curElement.offsetHeight / containerRect.height) * 100;

			const xPercent = Math.min(Math.max(0, (x / containerRect.width) * 100), 100 - elementWidthPercent);
			const yPercent = Math.min(Math.max(0, (y / containerRect.height) * 100), 100 - elementHeightPercent);

			curElement.style.left = `${xPercent}%`;
			curElement.style.top = `${yPercent}%`;
		};

		const onMouseUp = () => {
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);

			if (changeData) {
				const prevData = { ...data };
				data.x = parseInt(curElement.style.left);
				data.y = parseInt(curElement.style.top);

				if (startX !== data.x && startY !== data.y) changeData(data, prevData, index);
			}
		};

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	};

	const colorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const color: string = event.target.value;
		setPColor(color);
	};

	const finishColorChange = (event: React.FocusEvent<HTMLInputElement>) => {
		const color: string = event.target.value;
		setPColor(color);

		if (changeData) {
			const prevData = { ...data };
			data.color = color;
			changeData(data, prevData, index);
		}
	};

	const changeDirection = (direction: "down-left" | "down-right" | "up-left" | "up-right") => {
		setDireciton(direction);

		if (changeData) {
			const prevData = { ...data };
			data.direction = direction;
			changeData(data, prevData, index);
		}
	};

	const remove = () => {
		if (changeData) {
			const prevData = { ...data };
			data.type = ImageObjectTypes.Unknown;
			changeData(data, prevData, index, true);
		}
	};

	return (
		<div
			ref={mainRef}
			onMouseDown={handleMouseDown}
			className={className}
			style={{ ...style, left: position.left + "%", top: position.top + "%" }}
		>
			<Icon
				code={`arrow-${curDirection}`}
				className={isSelected && "selected"}
				svgStyle={{ width: "3em", height: "3em", color: pColor }}
			/>

			{editable && isSelected && (
				<ModalLayoutDark className="toolbar toolbar__under">
					<ButtonsLayout>
						<Button
							tooltipText={messages[1]}
							icon={"arrow-up-left"}
							onClick={() => changeDirection("up-left")}
						/>
						<Button
							tooltipText={messages[2]}
							icon={"arrow-up-right"}
							onClick={() => changeDirection("up-right")}
						/>
						<Button
							tooltipText={messages[3]}
							icon={"arrow-down-left"}
							onClick={() => changeDirection("down-left")}
						/>
						<Button
							tooltipText={messages[4]}
							icon={"arrow-down-right"}
							onClick={() => changeDirection("down-right")}
						/>
						<Input defaultValue={pColor} type="color" onChange={colorChange} onBlur={finishColorChange} />
						<div className="divider" />
						<Button tooltipText={messages[0]} icon={"trash"} onClick={remove} />
					</ButtonsLayout>
				</ModalLayoutDark>
			)}
		</div>
	);
};

export default styled(Pointer)`
	display: flex;
	position: absolute;
	justify-content: center;
	align-items: center;
	width: fit-content;
	height: fit-content;

	:active {
		cursor: grabbing;
	}

	.toolbar {
		position: absolute;
		display: flex;
		align-items: center;
		gap: 5px;
		bottom: 10px;
		left: 50%;
		border-radius: 10px;
		z-index: 100;
		transform: translateX(-50%);
	}

	.toolbar__under {
		transform: translateX(-50%) translateY(150%) !important;
	}

	.selected {
		outline: 2px solid #1476ff;
		align-content: center;
	}

	.selected p {
		user-select: none;
	}

	svg {
		pointer-events: none;
	}

	.icon {
		max-width: 100%;
		min-width: 3em;
		height: auto;
		margin: auto;
	}
`;
