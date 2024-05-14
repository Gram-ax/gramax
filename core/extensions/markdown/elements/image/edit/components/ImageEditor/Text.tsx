"use client";

import React, { useState, useRef, useEffect, RefObject } from "react";
import { ImageObjectTypes, TextObject } from "../../model/imageEditorTypes";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import Input from "@components/Atoms/Input";
import styled from "@emotion/styled";
import useLocalize from "@ext/localization/useLocalize";

const TextImage = (
	props: TextObject & {
		parentRef: RefObject<HTMLDivElement>;
		editable: boolean;
		index: number;
		selected: boolean;
		className?: string;
	},
) => {
	const { index, type, x, y, text, fontSize, editable, color, selected, onClick, changeData, parentRef, className } =
		props;
	const mainRef = useRef<HTMLDivElement>(null);
	const paragraphRef = useRef<HTMLParagraphElement>(null);

	const [position, setPosition] = useState({ left: 0, top: 0 });
	const [textData, setTextData] = useState({ fontSize: 24, color: "#ffffff" });
	const [value, setValue] = useState<string>(text);

	const deleteMessage = useLocalize("delete");

	const data: TextObject = {
		type: type,
		x: x,
		y: y,
		text: value,
		fontSize: textData.fontSize,
		color: textData.color,
	};

	useEffect(() => {
		setPosition({ left: x, top: y });
		setTextData({ fontSize: fontSize, color: color });
		setValue(text);

		if (selected) onClick([mainRef.current, index]);
	}, [text, x, y, fontSize, color, selected]);

	const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = (event) => {
		if (!editable || !mainRef.current) return false;

		if (onClick && !onClick([mainRef.current, index])) return false;

		const curElement = mainRef.current;
		const parentContainer = parentRef.current;

		const offsetX = event.clientX - curElement.getBoundingClientRect().left;
		const offsetY = event.clientY - curElement.getBoundingClientRect().top;
		const containerRect = parentContainer?.getBoundingClientRect();

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

	const handleTextInput = (event: React.ChangeEvent<HTMLInputElement>) => {
		const target = event.target as HTMLInputElement;
		let text: string = target.value;

		if (!text.length) text = "Пустое поле";

		setValue(text);

		if (changeData) {
			const prevData = { ...data };
			data.text = text;
			changeData(data, prevData, index);
		}
	};

	const colorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const color: string = event.target.value;
		setTextData({ fontSize: textData.fontSize, color: color });
	};

	const finishColorChange = (event: React.FocusEvent<HTMLInputElement>) => {
		const color: string = event.target.value;
		setTextData({ fontSize: textData.fontSize, color: color });

		if (changeData) {
			const prevData = { ...data };
			data.color = color;
			changeData(data, prevData, index);
		}
	};

	const handleSizeInput = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key !== "Enter") return;

		const target = event.target as HTMLInputElement;
		let size = Number(target.value);

		if (!size || size >= 48 || size == 0) size = 5;

		if (changeData) {
			const prevData = { ...data };
			data.fontSize = size;
			changeData(data, prevData, index);
		}

		setTextData((prevTextData) => {
			return {
				...prevTextData,
				fontSize: Number(size),
			};
		});
	};

	const remove = () => {
		if (changeData) {
			const prevData = { ...data };
			data.type = ImageObjectTypes.Unknown;
			changeData(data, prevData, index);
		}
	};

	return (
		<div
			ref={mainRef}
			onMouseDown={handleMouseDown}
			className={className}
			style={{ left: position.left + "%", top: position.top + "%" }}
		>
			<p
				style={{ fontSize: textData.fontSize + "px", color: textData.color }}
				className={`${selected && "selected"}`}
				ref={paragraphRef}
			>
				{value}
			</p>

			{editable && selected && (
				<ModalLayoutDark className="toolbar toolbar__under">
					<ButtonsLayout>
						<Input placeholder={text} type="text" onChange={handleTextInput} />
						<Input
							max={48}
							min={1}
							placeholder={textData.fontSize.toString()}
							style={{ width: "3vw" }}
							type="number"
							onKeyDown={handleSizeInput}
						/>
						<Input defaultValue={color} type="color" onChange={colorChange} onBlur={finishColorChange} />
						<div className="divider" />
						<Button icon={"trash"} tooltipText={deleteMessage} onClick={remove} />
					</ButtonsLayout>
				</ModalLayoutDark>
			)}
		</div>
	);
};

export default styled(TextImage)`
	display: flex;
	position: absolute;
	justify-content: center;
	align-items: center;
	width: fit-content;
	height: fit-content;

	:active {
		cursor: grabbing;
	}

	.selected {
		outline: 2px solid #1476ff;
		align-content: center;
	}

	.selected p {
		user-select: none;
	}

	p {
		font-size: 18px;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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
