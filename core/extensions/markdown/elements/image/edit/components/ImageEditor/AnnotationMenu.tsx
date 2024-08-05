import Input from "@components/Atoms/Input";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import debounceFunction from "@core-ui/debounceFunction";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { FormEventHandler, useEffect, useRef, useState } from "react";
import { DirectionType } from "../../model/imageEditorTypes";

const ANNOTATION_MENU_SYMBOL = Symbol();

interface AnnotationMenuProps {
	index: number;
	tooltipText: string;
	setTooltipText: (index: number, text: string) => void;
	setIndex: (index: number, newIndex: number) => void;
	curDirection: DirectionType;
	changeDirection: (index: number, direction: DirectionType) => void;
	remove: (index: number, bSave: boolean) => void;
	maxIndex: number;
}

const directionIcons = {
	["top-left"]: "arrow-up-left",
	["top-right"]: "arrow-up-right",
	["bottom-right"]: "arrow-down-right",
	["bottom-left"]: "arrow-down-left",
};

const getNewDirection = (curDirection: DirectionType): DirectionType => {
	if (curDirection === "top-left") return "top-right";
	else if (curDirection === "top-right") return "bottom-right";
	else if (curDirection === "bottom-right") return "bottom-left";
	else return "top-left";
};

const AnnotationMenu = (props: AnnotationMenuProps) => {
	const { index, maxIndex, curDirection, setIndex, tooltipText, setTooltipText, changeDirection, remove } = props;

	const [text, setText] = useState<string>(tooltipText);
	const [cIndex, setCIndex] = useState<number>(index);
	const [indexErrorText, setIndexErrorText] = useState<string>(null);

	const textRef = useRef<HTMLInputElement>();
	const indexRef = useRef<HTMLInputElement>();

	const localizedDelete = t("delete");
	const invalidIndex = t("invalid-index");
	const annotationText = t("annotation-text");

	const localizeDirections = {
		["bottom-left"]: t("bottom-left-pointer"),
		["bottom-right"]: t("bottom-right-pointer"),
		["top-left"]: t("top-left-pointer"),
		["top-right"]: t("top-right-pointer"),
	};

	useEffect(() => {
		setText(tooltipText);
	}, [tooltipText]);

	useEffect(() => {
		const indexInput = indexRef.current;
		if (!indexInput) return;
		setCIndex(index + 1);
		indexInput.value = "";
	}, [index]);

	const validateIndex: FormEventHandler<HTMLInputElement> = (event) => {
		const inputElement = event.target as HTMLInputElement;
		const value = +inputElement.value;
		if (value === null || value === undefined || value === 0) return;
		if (value < 1 || value > maxIndex) {
			setIndexErrorText(invalidIndex);
			return;
		}

		setIndexErrorText(null);
	};

	return (
		<div id={"toolbar/" + index} style={{ position: "relative" }}>
			<ModalLayoutDark>
				<ButtonsLayout>
					<Input
						ref={textRef}
						type="text"
						value={text}
						placeholder={annotationText}
						onChange={(event) => {
							setText(event.target.value);
							debounceFunction(
								ANNOTATION_MENU_SYMBOL,
								() => setTooltipText(index, event.target.value),
								200,
							);
						}}
					/>

					{maxIndex > 1 && (
						<>
							<div className="divider" />

							<Input
								showErrorText={indexErrorText && indexErrorText.length > 0}
								errorText={indexErrorText}
								min={1}
								value=""
								onInput={validateIndex}
								max={maxIndex}
								disabled={maxIndex === 1}
								ref={indexRef}
								type="number"
								style={{ width: "2rem" }}
								placeholder={`#${cIndex}`}
								onChange={(event) => setIndex(index, +event.target.value)}
							/>
						</>
					)}

					<div className="divider" />

					<Button
						icon={directionIcons[curDirection]}
						tooltipText={localizeDirections[curDirection]}
						onClick={() => changeDirection(index, getNewDirection(curDirection))}
					/>
					<div className="divider" />
					<Button tooltipText={localizedDelete} icon={"trash"} onClick={() => remove(index, true)} />
				</ButtonsLayout>
			</ModalLayoutDark>
		</div>
	);
};

export default AnnotationMenu;
