import resolveModule from "@app/resolveModule/frontend";
import Icon from "@components/Atoms/Icon";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import AnnotationMenu from "@ext/markdown/elements/image/edit/components/ImageEditor/AnnotationMenu";
import {
	MINIMUM_SQUARE_SIZE,
	calculateScale,
	cropImage,
	restoreImage,
} from "@ext/markdown/elements/image/edit/logic/imageEditorMethods";
import UnifiedComponent from "@ext/markdown/elements/image/render/components/ImageEditor/Unified";
import { CSSProperties, MouseEventHandler, ReactEventHandler, useEffect, useRef, useState } from "react";
import {
	AdditionData,
	AnnotationObject,
	Crop,
	DirectionType,
	EditorProps,
	ImageObject,
	ImageObjectTypes,
	ImageProps,
	SquareObject,
} from "../../model/imageEditorTypes";
import ImageCropper from "./ImageCropper";

const ImageEditor = (props: EditorProps & { className?: string; style?: CSSProperties }) => {
	const { crop, src, objects, handleSave, handleToggle, className, style } = props;
	const [cropEnabled, setCropEnabled] = useState<boolean>(false);
	const [selectedIndex, setSelectedIndex] = useState<number>(null);
	const [elements, setElements] = useState<ImageObject[]>(objects ?? []);
	const [prevElements, setPrevElements] = useState<ImageObject[]>(null);
	const [imageSize, setImageSize] = useState<{ w: number; h: number }>({ w: null, h: null });
	const [curCrop, setCrop] = useState(crop);
	const [prevCrop, setPrevCrop] = useState(null);
	const [additions, setAdditions] = useState<AdditionData[]>([]);
	const [showWarning, setShowWarning] = useState<boolean>(false);

	const [tooltipText, setTooltipText] = useState<string>(null);
	const [curDirection, setCurDirection] = useState<DirectionType>(null);

	const [lastKeypress, setLastKeypress] = useState<string>(null);

	const containerRef = useRef<HTMLDivElement>(null);
	const imgRef = useRef<HTMLImageElement>(null);
	const imageContainerRef = useRef<HTMLDivElement>(null);

	const messages = {
		addAnnotation: t("add-annotation"),
		addSquare: t("add-square"),
		cropImage: t("crop-image"),
		cancelCrop: t("cancel-crop"),
		cancel: t("cancel"),
		saveChanges: t("save-changes"),
		dontSave: t("dont-save"),
		unsavedChanges: t("unsaved-changes"),
		exitEditMode: t("exit-edit-mode"),
		apply: t("apply"),
		saveAndExit: t("save-and-exit"),
	};

	const mainSrc = resolveModule("useImage")(src);

	const addElement = (newElement: ImageObject) => {
		setSelectedIndex(() => {
			const updatedElements = [...elements, newElement];
			setElements(updatedElements);

			setTooltipText(newElement.text);
			setCurDirection(newElement.direction);

			const newIndex = Math.max(0, updatedElements.length - 1);
			changeData(newIndex, "object", null);
			return newIndex;
		});
	};

	const selectElement = (id: number) => {
		setSelectedIndex(() => {
			const data = elements[id];
			if (data) {
				setTooltipText(data.text);
				setCurDirection(data.direction);
			}

			return id;
		});
	};

	const saveData = (exit: boolean) => {
		handleSave(elements, curCrop);
		setAdditions([]);

		if (exit) handleToggle();
	};

	useEffect(() => {
		if (!imgRef.current) return;

		setElements(objects ?? []);
		restoreImage(imgRef.current, imageSize);
	}, [mainSrc, objects]);

	useEffect(() => {
		if (!prevCrop) return;
		toggleAnimate();
	}, [prevCrop]);

	const getClickPos = (element: HTMLDivElement, x: number, y: number) => {
		const { left, top, width, height } = element.getBoundingClientRect();
		return { x: Math.round(((x - left) / width) * 100), y: Math.round(((y - top) / height) * 100) };
	};

	let mouseFirstDownPos = { x: 0, y: 0 };
	let squareElement: HTMLDivElement = null;
	let isDrawing = false;

	const handleMouseDown: MouseEventHandler<HTMLDivElement> = (event) => {
		if (event.detail !== 2 || event.target !== imageContainerRef.current) return;

		const { x, y } = getClickPos(event.target as HTMLDivElement, event.clientX, event.clientY);
		mouseFirstDownPos = { x, y };
		event.preventDefault();
	};

	const handleMouseMove: MouseEventHandler<HTMLDivElement> = (event) => {
		if (!isDrawing || !squareElement) {
			if (mouseFirstDownPos.x === 0 && mouseFirstDownPos.y === 0) return;
			isDrawing = true;

			squareElement = document.createElement("div");
			squareElement.style.position = "absolute";
			squareElement.style.backgroundColor = "transparent";
			squareElement.style.border = "3px solid #fc2847";
			squareElement.style.borderRadius = "4px";
			squareElement.style.pointerEvents = "none";
			imageContainerRef.current.appendChild(squareElement);
		}

		const { x, y } = getClickPos(imageContainerRef.current, event.clientX, event.clientY);

		const width = Math.abs(x - mouseFirstDownPos.x);
		const height = Math.abs(y - mouseFirstDownPos.y);

		squareElement.style.left = Math.min(x, mouseFirstDownPos.x) + "%";
		squareElement.style.top = Math.min(y, mouseFirstDownPos.y) + "%";
		squareElement.style.width = width + "%";
		squareElement.style.height = height + "%";
	};

	const removeDrawingObject = () => {
		if (!isDrawing || !squareElement) return;
		mouseFirstDownPos = { x: 0, y: 0 };
		imageContainerRef.current.removeChild(squareElement);
		squareElement = null;
		isDrawing = false;
	};

	const handleMouseUp: MouseEventHandler<HTMLDivElement> = (event) => {
		if (mouseFirstDownPos.x === 0 && mouseFirstDownPos.y === 0) return;
		const imageContainerRect = imageContainerRef.current.getBoundingClientRect();
		const { x, y } = getClickPos(event.target as HTMLDivElement, event.clientX, event.clientY);

		if (!isDrawing && x === mouseFirstDownPos.x && y === mouseFirstDownPos.y) {
			createChildren(ImageObjectTypes.Annotation, x, y);
		} else if (isDrawing && squareElement && event.target === imageContainerRef.current) {
			const pixelFirstDownPosX = (mouseFirstDownPos.x / 100) * imageContainerRect.width;
			const pixelFirstDownPosY = (mouseFirstDownPos.y / 100) * imageContainerRect.height;
			const pixelCurrentPosX = (x / 100) * imageContainerRect.width;
			const pixelCurrentPosY = (y / 100) * imageContainerRect.height;

			if (
				Math.abs(pixelCurrentPosX - pixelFirstDownPosX) >= MINIMUM_SQUARE_SIZE &&
				Math.abs(pixelCurrentPosY - pixelFirstDownPosY) >= MINIMUM_SQUARE_SIZE
			)
				createChildren(
					ImageObjectTypes.Square,
					parseFloat(squareElement.style.left),
					parseFloat(squareElement.style.top),
					Math.abs(parseInt(squareElement.style.width)),
					Math.abs(parseInt(squareElement.style.height)),
				);
		}

		removeDrawingObject();
	};

	const createChildren = (type: ImageObjectTypes, x?: number, y?: number, w?: number, h?: number) => {
		if (cropEnabled) return;

		switch (type) {
			case ImageObjectTypes.Annotation: {
				const annotationObject: AnnotationObject = {
					type: ImageObjectTypes.Annotation,
					x: x ?? 50,
					y: y ?? 50,
					text: "",
					direction: "top-left",
				};

				addElement(annotationObject);
				break;
			}
			case ImageObjectTypes.Square: {
				const squareObject: SquareObject = {
					type: ImageObjectTypes.Square,
					x: x ?? 50,
					y: y ?? 50,
					w: w ?? 25,
					h: h ?? 25,
					text: "",
					direction: "top-left",
				};

				addElement(squareObject);
				break;
			}
		}
	};

	const clearSelected: MouseEventHandler<HTMLDivElement> = (event) => {
		if (selectedIndex === undefined) return;

		const selectedElement = document.getElementById("object/" + selectedIndex);
		const target = event.target as HTMLDivElement;

		if (!selectedElement || selectedElement === target || target !== imageContainerRef.current) return;

		selectElement(null);
	};

	const toggleCropper = (): boolean => {
		const image = imgRef.current;

		selectElement(null);
		setCropEnabled(!cropEnabled);

		if (cropEnabled) {
			cropImage({ image, imageSize, crop: curCrop });
			resetUpdateArea();
			toggleAnimate();

			changeData(0, "image", { src: src, crop: prevCrop, objects: prevElements });

			setElements(() => {
				const newElements = [...prevElements];
				setPrevElements(null);

				return newElements;
			});
		}

		if (!cropEnabled) {
			setPrevElements(() => {
				const newElements = [...elements];
				setElements([]);

				return newElements;
			});
			setElements([]);
			restoreImage(image, imageSize);
			handleUpdateArea(curCrop);
			setPrevCrop(curCrop);
		}

		return true;
	};

	const toggleAnimate = () => {
		const image = imgRef.current;
		const imageContainer = imageContainerRef.current;
		const modalContainer = imageContainer.parentElement;

		modalContainer.classList.toggle("animate");
		imageContainer.classList.toggle("animate");
		image.classList.toggle("animate");
	};

	const resetCropper = () => {
		const image = imgRef.current;
		setCropEnabled(() => {
			setElements(elements);
			cropImage({ image, imageSize, crop: prevCrop });
			resetUpdateArea();
			toggleAnimate();

			setCrop(prevCrop);
			setElements(() => {
				const newElements = [...prevElements];
				setPrevElements(null);

				return newElements;
			});

			setPrevCrop(null);
			return false;
		});
	};

	const changeData = (index: number, type: "image" | "object", data: ImageProps | ImageObject, newIndex?: number) => {
		const changes = [...additions];
		changes.push({ type, newIndex, index, data });
		setAdditions(changes);
	};

	const revertAdditions = (changes: AdditionData) => {
		if (changes === undefined) return;

		if (changes.type === "object") {
			const updatedElements = [...elements];
			if (!changes.data) removeObject(changes.index, false);
			else {
				if (changes.newIndex) {
					[updatedElements[changes.index], updatedElements[changes.newIndex - 1]] = [
						updatedElements[changes.newIndex - 1],
						updatedElements[changes.index],
					];
				} else updatedElements[changes.index] = changes.data as ImageObject;

				setElements(updatedElements);
			}
		} else if (changes.type === "image") {
			const data = changes.data as ImageProps;
			setCrop(() => {
				cropImage({ image: imgRef.current, imageSize, crop: data.crop });
				resetUpdateArea();
				return data.crop;
			});
			setElements(data.objects);
			setPrevCrop(null);
		}

		const newAdditions = [...additions];
		newAdditions.splice(newAdditions.length - 1, 1);
		setAdditions(newAdditions);
		selectElement(null);
	};

	const isDataEqual = (data: any, element: ImageObject) => {
		for (const key in data) {
			if (data[key] !== element?.[key]) {
				return false;
			}
		}
		return true;
	};

	const setElementData = (index: number, data: any) => {
		const prevData = [...elements];
		const updatedElements = [...prevData];
		const element = updatedElements[index];

		if (isDataEqual(data, element)) return;

		updatedElements[index] = { ...element, ...data };
		setElements(updatedElements);
		changeData(index, "object", prevData[index]);
	};

	const changeDirection = (index: number, direction: DirectionType) => {
		setElementData(index, { direction });
		setCurDirection(direction);
	};

	const changeIndex = (index: number, newIndex: number) => {
		if (index === newIndex - 1 || !elements?.[index] || !elements?.[newIndex - 1]) return;
		setElements((prevElements) => {
			const newElements = [...prevElements];
			changeData(index, "object", newElements[index], newIndex);
			[newElements[index], newElements[newIndex - 1]] = [newElements[newIndex - 1], newElements[index]];
			selectElement(newIndex - 1);
			return newElements;
		});
	};

	const removeObject = (index: number, save: boolean) => {
		setElements(() => {
			selectElement(null);
			const newElements = [...elements];
			if (save) changeData(index, "object", newElements[index]);
			newElements.splice(index, 1);
			return newElements;
		});
	};

	const changeText = (index: number, text: string) => {
		setElementData(index, { text });
		setTooltipText(text);
	};

	const resetUpdateArea = () => {
		const imageContainer = imageContainerRef.current;
		const modalContainer = imageContainer.parentElement;

		modalContainer.style.position = "relative";
		modalContainer.style.left = "50%";
		modalContainer.style.top = "50%";
	};

	const handleUpdateArea = (crop: Crop, callback?: () => void) => {
		const imageContainer = imageContainerRef.current;
		const modalContainer = imageContainer.parentElement;
		const parentContainer = modalContainer.parentElement;

		const modalRect = modalContainer.getBoundingClientRect();
		const parentRect = parentContainer.getBoundingClientRect();

		const cropCenterX = modalRect.left + ((crop.x + crop.w / 2) * modalRect.width) / 100;
		const cropCenterY = modalRect.top + ((crop.y + crop.h / 2) * modalRect.height) / 100;

		const viewportCenterX = parentRect.left + parentRect.width / 2;
		const viewportCenterY = parentRect.top + parentRect.height / 2;

		const offsetX = viewportCenterX - cropCenterX;
		const offsetY = viewportCenterY - cropCenterY;

		modalContainer.style.position = "absolute";
		modalContainer.style.left = `${modalContainer.offsetLeft + offsetX}px`;
		modalContainer.style.top = `${modalContainer.offsetTop + offsetY}px`;

		if (callback) callback();
	};

	const onKeyDown = (ev: KeyboardEvent) => {
		const char = ev.key;

		const isUndo = (ev.ctrlKey || ev.metaKey) && char === "z";
		if (isUndo) {
			if (lastKeypress !== char && additions.length > 0) {
				revertAdditions(additions[additions.length - 1]);
			}

			ev.preventDefault();
		} else if (char === "Escape") closeEditor();
		else setLastKeypress(char);
	};

	const closeEditor = (force?: boolean) => {
		if (cropEnabled) return;
		if (force || additions.length === 0) {
			window.removeEventListener("keydown", onKeyDown);
			containerRef.current.remove();
		} else if (additions.length > 0) setShowWarning(true);
	};

	useEffect(() => {
		window.addEventListener("keydown", onKeyDown);

		return () => {
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [lastKeypress, additions]);

	const handleOnLoad: ReactEventHandler<HTMLImageElement> = (e) => {
		const target = e.target as HTMLImageElement;
		const parent = target.parentElement;
		const grandparent = parent.parentElement;

		const maxWidth = grandparent.clientWidth;
		const maxHeight = grandparent.clientHeight;

		let currentWidth = target.clientWidth;
		let currentHeight = target.clientHeight;

		if (currentWidth > maxWidth) {
			const widthScaleFactor = maxWidth / currentWidth;
			currentWidth = maxWidth;
			currentHeight = currentHeight * widthScaleFactor;
		}

		if (currentHeight > maxHeight) {
			const heightScaleFactor = maxHeight / currentHeight;
			currentHeight = maxHeight;
			currentWidth = currentWidth * heightScaleFactor;
		}

		setImageSize({ w: currentWidth, h: currentHeight });

		parent.style.width = currentWidth + "px";
		parent.style.height = currentHeight + "px";

		target.style.width = currentWidth + "px";
		target.style.height = currentHeight + "px";

		target.style.position = "absolute";

		if (crop) {
			const newImageSize = { w: currentWidth, h: currentHeight };
			const scale = calculateScale(imageContainerRef.current, newImageSize, crop);
			cropImage({
				image: target,
				imageSize: newImageSize,
				crop,
				scale,
			});
			resetUpdateArea();
		}
	};

	return (
		<div
			id="image-editor-container"
			ref={containerRef}
			onMouseDown={(event) => (event.target as HTMLDivElement)?.id === "image-editor-container" && closeEditor()}
			onMouseUp={handleMouseUp}
			onClick={clearSelected}
			className={className}
		>
			<Icon className="x-mark" code="x" onClick={() => closeEditor()} />

			{showWarning && (
				<div className="modal__confirm">
					<div className="modal__confirm__container">
						<InfoModalForm
							title={messages.unsavedChanges}
							icon={{ code: "circle-alert", color: "rgb(255 187 1)" }}
							onCancelClick={() => setShowWarning(false)}
							secondButton={{ onClick: () => closeEditor(true), text: messages.dontSave }}
							actionButton={{ onClick: () => saveData(true), text: messages.saveChanges }}
							closeButton={{ text: messages.cancel }}
						>
							<span>{messages.exitEditMode}</span>
						</InfoModalForm>
					</div>
				</div>
			)}

			<div
				draggable="false"
				onDragStart={(e) => e.preventDefault()}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				className="modal__container"
			>
				<ImageCropper
					crop={curCrop}
					setCrop={setCrop}
					handleUpdateArea={handleUpdateArea}
					cropEnabled={cropEnabled}
					parentRef={imageContainerRef}
				/>
				<div ref={imageContainerRef} className="modal__container__image">
					<img
						ref={imgRef}
						onLoad={handleOnLoad}
						draggable="false"
						onDragStart={(e) => e.preventDefault()}
						src={mainSrc}
						style={style}
						alt=""
					/>
					{elements.map((data: ImageObject, index: number) => (
						<UnifiedComponent
							index={index}
							key={index}
							parentRef={imageContainerRef}
							type={data.type}
							{...data}
							onClick={(index: number) => selectElement(index)}
							selectedIndex={selectedIndex}
							changeData={setElementData}
							editable={true}
							drawIndexes={elements.length > 1}
						/>
					))}
				</div>
			</div>

			{mainSrc && (
				<div className="toolbar__under">
					{selectedIndex !== null && (
						<AnnotationMenu
							setIndex={changeIndex}
							remove={removeObject}
							curDirection={curDirection}
							tooltipText={tooltipText}
							setTooltipText={changeText}
							index={selectedIndex}
							changeDirection={changeDirection}
							maxIndex={elements.length}
						/>
					)}

					{cropEnabled && (
						<ModalLayoutDark>
							<ButtonsLayout>
								<>
									<Button text={messages.apply} icon={"check"} onClick={toggleCropper} />
									<Button text={messages.cancel} icon={"x"} onClick={resetCropper} />
								</>
							</ButtonsLayout>
						</ModalLayoutDark>
					)}

					<ModalLayoutDark>
						<ButtonsLayout>
							<Button
								tooltipText={messages.addAnnotation}
								icon={"circle-arrow-out-up-left"}
								onClick={() => createChildren(ImageObjectTypes.Annotation)}
							/>
							<Button
								tooltipText={messages.addSquare}
								icon={"scan"}
								onClick={() => createChildren(ImageObjectTypes.Square)}
							/>

							<div className="divider" />
							<Button
								tooltipText={messages.cropImage}
								icon={"crop"}
								onClick={cropEnabled ? resetCropper : toggleCropper}
								isActive={cropEnabled || (curCrop.w < 99 && curCrop.h < 99)}
							/>

							<div className="divider" />
							<Button
								hidden={!mainSrc}
								text={messages.saveAndExit}
								icon={"save"}
								onClick={() => saveData(true)}
							/>
						</ButtonsLayout>
					</ModalLayoutDark>
				</div>
			)}
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

	.animate {
		transition: all 0.5s ease;
	}

	input[type="number"]::-webkit-inner-spin-button,
	input[type="number"]::-webkit-outer-spin-button {
		-webkit-appearance: none;
	}

	.modal__confirm {
		z-index: 201;
		background-color: #2929298d;
		position: fixed;
		width: 100vw;
		height: 100vh;
	}

	.modal__confirm__container {
		position: absolute;
		min-width: 30em;
		max-width: 45%;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	.x-mark {
		position: absolute;
		top: 0;
		right: 0;
		padding-top: 1.2em;
		padding-right: 1.2em;
		cursor: pointer;
		transition: 0.25s;
		font-size: var(--big-icon-size);
		color: var(--color-active-white);

		:hover {
			color: var(--color-active-white-hover);
		}

		${cssMedia.narrow} {
			display: none;
		}
	}

	.text_x_large .button .iconFrame i {
		font-size: 1.5rem;
	}

	.modal__container {
		position: relative;
		top: 50%;
		left: 50%;
		border: solid #bdbdbd 1px;
		max-width: 75%;
		max-height: 85%;
		transform: translate(-50%, -50%);
		width: fit-content;
		height: fit-content;
	}

	.modal__container__image {
		position: relative;
		overflow: hidden;
	}

	.modal__container__image img {
		width: auto;
		height: auto;
		position: relative;
	}

	.toolbar {
		position: absolute;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 4px;
		left: 50%;
		z-index: 100;
		transform: translateX(-50%);
	}

	.toolbar__dropdown__top {
		position: absolute;
		bottom: 4px;
		background-color: #000000;
	}

	.toolbar__top {
		top: 1rem;
		bottom: auto;
		transform: translateX(-50%);
	}

	.toolbar__under {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		left: 50%;
		bottom: 1rem;
		transform: translateX(-50%);
		gap: 4px;
		z-index: 50;
		margin-top: 0.5rem;
	}

	img {
		user-select: none;
		pointer-events: none;
	}

	.selected {
		outline: 2px solid var(--color-focus);
		align-content: center;
	}
`;
