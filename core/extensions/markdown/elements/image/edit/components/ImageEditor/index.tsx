"use client";

import { Crop, EditorProps, ImageObject, ImageObjectTypes } from "../../model/imageEditorTypes";
import React, { useState, useEffect, useRef } from "react";
import ImageCropper from "./ImageCropper";
import resolveModule from "@app/resolveModule/frontend";
import Url from "@core-ui/ApiServices/Types/Url";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import UnifiedComponent from "@ext/markdown/elements/image/edit/components/ImageEditor/Unified";
import styled from "@emotion/styled";
import linkCreator from "@ext/markdown/elements/link/render/logic/linkCreator";
import useLocalize from "@ext/localization/useLocalize";
import { cropImage, restoreImage } from "@ext/markdown/elements/image/edit/logic/imageEditorMethods";

const DELTA: number = 3000;

const ImageEditor = ({ imageProps, handleSave, handleToggle, className }: EditorProps & { className?: string }) => {
	const [cropEnabled, setCropEnabled] = useState<boolean>(false);
	const [selectedElement, setSelectedElement] = useState<HTMLDivElement>();
	const [elements, setElements] = useState<any[]>([]);
	const [crop, setCrop] = useState({ x: 0, y: 0, w: 100, h: 100 });
	const [selectedIndex, setSelectedIndex] = useState<number>();
	const [additions, setAdditions] = useState<any>([]);

	const [lastKeypress, setLastKeypress] = useState<string>(null);
	const [lastKeypressTime, setLastKeypressTime] = useState<number>(null);

	const containerRef = useRef<HTMLDivElement>(null);
	const imgRef = useRef<HTMLImageElement>(null);
	const modalRef = useRef<HTMLDivElement>(null);
	const imageContainerRef = useRef<HTMLDivElement>(null);

	const messages = [
		useLocalize("addText"),
		useLocalize("addPointer"),
		useLocalize("addSquare"),
		useLocalize("cropImage"),
		useLocalize("cancelCrop"),
	];

	const mainSrc =
		(linkCreator.isExternalLink(imageProps.src.toString()) && (imageProps.src as string)) ||
		resolveModule("useImage")(imageProps.src as Url);

	const addElement = (newElement: ImageObject) => {
		setElements((prevElements) => [...prevElements, newElement]);
	};

	const saveData = (exit: boolean) => {
		handleSave(elements, crop);
		setAdditions([]);

		if (exit && containerRef.current) handleToggle();
	};

	useEffect(() => {
		if (!imgRef.current || !imageContainerRef.current) return;

		setElements([]);
		imageProps?.objects?.forEach((object) => {
			addElement(object);
		});

		restoreImage(imageContainerRef.current, imgRef.current, mainSrc);

		setTimeout(() => {
			if (imageProps?.crop) cropImage(imgRef.current, imageContainerRef.current, mainSrc, imageProps?.crop);
		}, 10);

		if (imageProps?.crop)
			setCrop({
				x: imageProps?.crop?.x || imageProps?.crop[0] || 0,
				y: imageProps?.crop?.y || imageProps?.crop[1] || 0,
				w: imageProps?.crop?.w || imageProps?.crop[2] || 100,
				h: imageProps?.crop?.h || imageProps?.crop[3] || 100,
			});
	}, [mainSrc, imageProps]);

	const clearSelected = (event: React.MouseEvent<HTMLDivElement>) => {
		if (selectedIndex === undefined) return;

		const target = event.target as HTMLDivElement;

		if (selectedElement && (selectedElement === target || selectedElement.contains(target))) return;

		setSelectedIndex(undefined);
		setSelectedElement(undefined);
	};

	const handleClick = (elementData: [HTMLDivElement, number]): boolean => {
		if (cropEnabled) return false;

		const element: HTMLDivElement = elementData[0];
		const index: number = elementData[1];

		setSelectedIndex(index);
		setSelectedElement(element);

		return true;
	};

	const createChildren = (type: ImageObjectTypes) => {
		if (cropEnabled) return;

		switch (type) {
			case ImageObjectTypes.Text: {
				const textObject = {
					type: ImageObjectTypes.Text,
					x: 50,
					y: 50,
					text: "Новый текст",
					fontSize: 24,
					color: "#000000",
				};

				addElement(textObject);
				break;
			}
			case ImageObjectTypes.Arrow: {
				const arrowObject = {
					type: ImageObjectTypes.Arrow,
					x: 50,
					y: 50,
					direction: "down-left",
					scale: 1,
					color: "#000000",
				};

				addElement(arrowObject);
				break;
			}
			case ImageObjectTypes.Square: {
				const squareObject = {
					type: ImageObjectTypes.Square,
					x: 50,
					y: 50,
					w: 25,
					h: 25,
					thick: 5,
					color: "#000000",
				};

				addElement(squareObject);
				break;
			}
		}

		setSelectedIndex(elements.length);
	};

	const toggleCropper = (): boolean => {
		if (!cropEnabled) {
			restoreImage(imageContainerRef.current, imgRef.current, mainSrc);
			setElements([]);

			const rect: Crop = {
				x: parseInt(imageContainerRef.current.style.left) || 0,
				y: parseInt(imageContainerRef.current.style.top) || 0,
				w: parseInt(imageContainerRef.current.style.width) || 100,
				h: parseInt(imageContainerRef.current.style.height) || 100,
			};

			setCrop(rect);
		} else cropImage(imgRef.current, imageContainerRef.current, mainSrc ?? "", crop);

		setCropEnabled(!cropEnabled);
		return true;
	};

	const resetCropper = () => {
		setCropEnabled(!cropEnabled);
	};

	const changeData = (data: ImageObject, prevData: ImageObject, index: number, noAddition?: boolean) => {
		const updatedElements = [...elements];
		let changes = [...additions];

		if (data.type === ImageObjectTypes.Unknown) {
			handleClick([undefined, undefined]);
			updatedElements.splice(index, 1);
		} else updatedElements[index] = data;

		if (!noAddition) {
			changes = [...changes, { index, prevData }];
			setAdditions(changes);
		}

		setElements(updatedElements);
	};

	const revertAdditions = (data: { index: number; prevData: ImageObject }) => {
		if (data === undefined) return;

		const updatedElements = [...elements];
		updatedElements[data.index] = data.prevData;

		setSelectedIndex(data.index);
		setElements(updatedElements);

		const newAdditions = [...additions];
		newAdditions.splice(newAdditions.length - 1, 1);
		setAdditions(newAdditions);
	};

	const onKeyDown = (ev: React.KeyboardEvent<HTMLDivElement>) => {
		const char = ev.key;

		const isUndo = (ev.ctrlKey || ev.metaKey) && char === "z";

		if (isUndo) {
			let thisKeypressTime = new Date().getTime();

			if (thisKeypressTime - lastKeypressTime <= DELTA && lastKeypress !== char) {
				revertAdditions(additions[additions.length - 1]);
				thisKeypressTime = 0;
			}

			ev.preventDefault();

			setLastKeypressTime(thisKeypressTime);
		} else {
			setLastKeypress(char);
		}
	};

	return (
		<div ref={containerRef} onKeyDown={onKeyDown} tabIndex={0} onClick={clearSelected} className={className}>
			<div className="toolbar toolbar__top">
				<ModalLayoutDark>
					<ButtonsLayout>
						<Button
							hidden={!mainSrc}
							text={useLocalize("Save")}
							icon={"save"}
							onClick={() => saveData(false)}
						/>
						<Button
							hidden={!mainSrc}
							text={useLocalize("saveAndExit")}
							icon={"save"}
							onClick={() => saveData(true)}
						/>
						<Button
							text={useLocalize("exit")}
							icon={"log-out"}
							onClick={() => {
								setAdditions([]);
								containerRef.current.remove();
							}}
						/>
					</ButtonsLayout>
				</ModalLayoutDark>
			</div>

			<div ref={modalRef} className="modal-container">
				<div ref={imageContainerRef} className="modal__image-container">
					<ImageCropper
						crop={imageProps?.crop || { x: 0, y: 0, w: 0, h: 0 }}
						setCrop={setCrop}
						cropEnabled={cropEnabled}
						parentRef={imageContainerRef}
					/>

					{(!mainSrc && <SpinnerLoader />) || (
						<img
							ref={imgRef}
							draggable="false"
							onDragStart={(e) => e.preventDefault()}
							src={mainSrc}
							alt=""
						/>
					)}

					{mainSrc && (
						<div className="objects">
							{elements.map((data: any, index: number) => (
								<UnifiedComponent
									index={index}
									key={index + 22}
									parentRef={imageContainerRef}
									type={data.type}
									{...data}
									selected={selectedIndex === index}
									onClick={handleClick}
									changeData={changeData}
									editable={true}
								/>
							))}
						</div>
					)}
				</div>

				{mainSrc && (
					<div className="toolbar toolbar__under">
						<ModalLayoutDark>
							<ButtonsLayout>
								<Button
									tooltipText={messages[0]}
									icon={"type"}
									onClick={() => createChildren(ImageObjectTypes.Text)}
								/>
								<Button
									tooltipText={messages[1]}
									icon={"arrow-down-left"}
									onClick={() => createChildren(ImageObjectTypes.Arrow)}
								/>
								<Button
									tooltipText={messages[2]}
									icon={"square"}
									onClick={() => createChildren(ImageObjectTypes.Square)}
								/>
								{!cropEnabled && (
									<Button tooltipText={messages[3]} icon={"crop"} onClick={toggleCropper} />
								)}
								{cropEnabled && (
									<>
										<div className="divider" />
										<Button tooltipText={messages[3]} icon={"check"} onClick={toggleCropper} />
										<Button tooltipText={messages[4]} icon={"x"} onClick={resetCropper} />
									</>
								)}
							</ButtonsLayout>
						</ModalLayoutDark>
					</div>
				)}
			</div>
		</div>
	);
};

export default styled(ImageEditor)`
	z-index: 200;
	position: fixed;
	width: 100vw;
	height: 100vh;
	left: 0;
	top: 0;
	background-color: var(--color-modal-overlay-style-bg);

	.modal__image-container {
		position: relative;
		max-width: 100%;
		max-height: 100%;
	}

	.modal-container {
		position: absolute;
		max-width: 75%;
		max-height: 85%;
		left: 50%;
		top: 50%;
		transform: translateX(-50%) translateY(-50%);
	}

	.modal-image {
		position: relative;
		display: block;
		max-width: 100%;
		max-height: 100%;
		user-select: none;
		padding: 0;
		margin: 0;
	}

	.toolbar {
		position: absolute;
		display: flex;
		align-items: center;
		bottom: 10px;
		left: 50%;
		z-index: 100;
		transform: translateX(-50%);
	}

	.toolbar__top {
		top: 0px;
		bottom: auto;
		transform: translateX(-50%);
	}

	.toolbar__under {
		transform: translateX(-50%) translateY(150%);
	}

	img {
		user-select: none;
		pointer-events: none;
	}
`;
