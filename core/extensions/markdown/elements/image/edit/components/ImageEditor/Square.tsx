"use client";

import React, { ReactElement, useRef, useEffect, useState, RefObject, ChangeEvent } from "react";
import { ImageObjectTypes, SquareObject } from "../../model/imageEditorTypes";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import Input from "@components/Atoms/Input";
import styled from "@emotion/styled";
import useLocalize from "@ext/localization/useLocalize";

const MINIMUM_SIZE = 60;
const Square = (
	props: SquareObject & {
		parentRef: RefObject<HTMLDivElement>;
		editable: boolean;
		index: number;
		selected: boolean;
		className?: string;
	},
): ReactElement => {
	const { index, type, thick, x, y, w, h, editable, color, selected, onClick, changeData, parentRef, className } =
		props;
	const [isSelected, setSelected] = useState<boolean>(Boolean(selected));
	const [sColor, setSColor] = useState<string>(color);
	const [thickness, setThickness] = useState<number>(thick ?? 5);
	const [isDrag, setDrag] = useState<boolean>(false);

	const mainRef = useRef<HTMLDivElement>(null);

	const data: SquareObject = {
		type: type,
		x: x,
		y: y,
		w: w,
		h: h,
		thick: thick,
		color: color,
	};

	const deleteMessage = useLocalize("delete");

	const mainOnClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
		const main = mainRef.current;

		if (onClick && !onClick([mainRef.current, index])) return;

		if (!editable || isDrag) return;

		if (main !== event.target) return;

		const offsetX = event.clientX - main.getBoundingClientRect().left;
		const offsetY = event.clientY - main.getBoundingClientRect().top;
		const containerRect = parentRef.current.getBoundingClientRect();

		const onMouseMove = (e: MouseEvent) => {
			if (isDrag) return;
			const x = e.clientX - containerRect.left - offsetX;
			const y = e.clientY - containerRect.top - offsetY;

			const elementWidthPercent = (main.offsetWidth / containerRect.width) * 100;
			const elementHeightPercent = (main.offsetHeight / containerRect.height) * 100;

			const xPercent = Math.min(Math.max(0, (x / containerRect.width) * 100), 100 - elementWidthPercent);
			const yPercent = Math.min(Math.max(0, (y / containerRect.height) * 100), 100 - elementHeightPercent);

			main.style.left = `${xPercent}%`;
			main.style.top = `${yPercent}%`;
		};

		const onMouseUp = () => {
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
			if (changeData) {
				const prevData = { ...data };
				data.x = parseInt(main.style.left);
				data.y = parseInt(main.style.top);
				data.w = parseInt(main.style.width);
				data.h = parseInt(main.style.height);
				changeData(data, prevData, index);
			}
		};

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	};

	const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (event) => {
		setDrag(true);
		event.preventDefault();

		const main = mainRef.current;
		const currentHandle = event.target as HTMLDivElement;
		const imageContainer = parentRef.current;
		const imageContainerRect = imageContainer.getBoundingClientRect();
		const cropperStyle = window.getComputedStyle(main);

		const startWidth = (parseFloat(cropperStyle.width) / imageContainerRect.width) * 100;
		const startHeight = (parseFloat(cropperStyle.height) / imageContainerRect.height) * 100;
		const startLeft = (parseFloat(cropperStyle.left) / imageContainerRect.width) * 100;
		const startTop = (parseFloat(cropperStyle.top) / imageContainerRect.height) * 100;

		const startX = event.clientX;
		const startY = event.clientY;

		const applyConstraints = (value, min, max) => {
			return Math.min(Math.max(value, min), max);
		};

		const onMouseMove = (event: MouseEvent) => {
			const deltaX = ((event.clientX - startX) / imageContainerRect.width) * 100;
			const deltaY = ((event.clientY - startY) / imageContainerRect.height) * 100;

			let newWidth = startWidth;
			let newHeight = startHeight;
			let newTop = startTop;
			let newLeft = startLeft;

			const minimumWidthPercent = (MINIMUM_SIZE / imageContainerRect.width) * 100;
			const minimumHeightPercent = (MINIMUM_SIZE / imageContainerRect.height) * 100;

			switch (currentHandle.id) {
				case "top-left":
					newWidth = applyConstraints(startWidth - deltaX, minimumWidthPercent, startWidth + startLeft);
					newHeight = applyConstraints(startHeight - deltaY, minimumHeightPercent, startHeight + startTop);
					newLeft = startLeft + (startWidth - newWidth);
					newTop = startTop + (startHeight - newHeight);
					break;
				case "top-right":
					newWidth = applyConstraints(startWidth + deltaX, minimumWidthPercent, 100 - startLeft);
					newHeight = applyConstraints(startHeight - deltaY, minimumHeightPercent, startHeight + startTop);
					newTop = startTop + (startHeight - newHeight);
					break;
				case "bottom-left":
					newWidth = applyConstraints(startWidth - deltaX, minimumWidthPercent, startWidth + startLeft);
					newHeight = applyConstraints(startHeight + deltaY, minimumHeightPercent, 100 - startTop);
					newLeft = startLeft + (startWidth - newWidth);
					break;
				case "bottom-right":
					newWidth = applyConstraints(startWidth + deltaX, minimumWidthPercent, 100 - startLeft);
					newHeight = applyConstraints(startHeight + deltaY, minimumHeightPercent, 100 - startTop);
					break;
			}

			newLeft = applyConstraints(newLeft, 0, 100 - newWidth);
			newTop = applyConstraints(newTop, 0, 100 - newHeight);

			main.style.width = `${newWidth}%`;
			main.style.height = `${newHeight}%`;
			main.style.left = `${newLeft}%`;
			main.style.top = `${newTop}%`;
		};

		const onMouseUp = () => {
			setDrag(false);
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);

			if (changeData) {
				const prevData = { ...data };
				data.x = parseInt(main.style.left);
				data.y = parseInt(main.style.top);
				data.w = parseInt(main.style.width);
				data.h = parseInt(main.style.height);
				changeData(data, prevData, index);
			}
		};

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	};

	useEffect(() => {
		setSelected(Boolean(selected));
		setSColor(color);
		setThickness(thick);

		if (selected) onClick([mainRef.current, index]);
	}, [color, selected, editable, thick]);

	const colorChange = (event: ChangeEvent) => {
		const target = event.target as HTMLInputElement;
		setSColor(target.value);
	};

	const finishColorChange = (event: React.FocusEvent<HTMLInputElement>) => {
		const color: string = event.target.value;
		setSColor(color);

		if (changeData) {
			const prevData = { ...data };
			data.color = color;
			changeData(data, prevData, index);
		}
	};

	const remove = () => {
		if (changeData) {
			const prevData = { ...data };
			data.type = ImageObjectTypes.Unknown;
			changeData(data, prevData, index);
		}
	};

	const thicknessChange = (event: ChangeEvent) => {
		const target = event.target as HTMLInputElement;
		let size = +target.value;

		if (!size || size >= 28 || size == 0) size = 5;
		setThickness(size);
	};

	const finishThicknessChange = (event: React.FocusEvent<HTMLInputElement>) => {
		const target = event.target as HTMLInputElement;
		let size = Number(target.value);

		if (!size || size >= 28 || size == 0) size = 5;

		if (changeData) {
			const prevData = { ...data };
			data.thick = size;
			changeData(data, prevData, index);
		}

		setThickness(size);
	};

	return (
		<div
			ref={mainRef}
			onMouseDown={mainOnClick}
			style={{
				left: x + "%",
				top: y + "%",
				width: w + "%",
				height: h + "%",
				borderColor: sColor,
				borderWidth: thickness + "px",
			}}
			className={className}
		>
			{editable && isSelected && (
				<div>
					<div onMouseDown={onMouseDown} id="top-left" className="handle top-left"></div>
					<div onMouseDown={onMouseDown} id="top-right" className="handle top-right"></div>
					<div onMouseDown={onMouseDown} id="bottom-right" className="handle bottom-right"></div>
					<div onMouseDown={onMouseDown} id="bottom-left" className="handle bottom-left"></div>
				</div>
			)}

			{editable && isSelected && (
				<ModalLayoutDark className="toolbar toolbar__under">
					<ButtonsLayout>
						<Input
							placeholder={thickness.toString()}
							type="number"
							style={{ width: "4vw" }}
							max={28}
							min={1}
							onChange={thicknessChange}
							onBlur={finishThicknessChange}
						/>
						<Input defaultValue={color} type="color" onChange={colorChange} onBlur={finishColorChange} />
						<div className="divider" />
						<Button tooltipText={deleteMessage} icon={"trash"} onClick={remove} />
					</ButtonsLayout>
				</ModalLayoutDark>
			)}
		</div>
	);
};

export default styled(Square)`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border: 2px solid #1476ff;
	cursor: move;

	.handle {
		position: absolute;
		width: 15px;
		height: 15px;
		border: 1px solid #000;
		background-color: #fff;
		user-select: none;
	}

	.top-left {
		left: 0;
		top: 0;
		cursor: nwse-resize;
		border-bottom-right-radius: 9999px;
	}

	.top-right {
		right: 0;
		top: 0;
		cursor: nesw-resize;
		border-bottom-left-radius: 9999px;
	}

	.bottom-left {
		left: 0;
		bottom: 0;
		cursor: nesw-resize;
		border-top-right-radius: 9999px;
	}

	.bottom-right {
		right: 0;
		bottom: 0;
		cursor: nwse-resize;
		border-top-left-radius: 9999px;
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
`;
