import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { useEffect, useState } from "react";
import Button, { TextSize } from "../Atoms/Button/Button";
import { ButtonStyle } from "../Atoms/Button/ButtonStyle";

interface EditorButtonsProps {
	confirmButtonText: string;
	onCancel: () => void;
	onConfirm: () => void;
	confirmDisabled?: boolean;
	style?: ButtonStyle;
	className?: string;
}

const EditorButtons = (props: EditorButtonsProps) => {
	const {
		confirmButtonText,
		onCancel,
		onConfirm,
		confirmDisabled = true,
		style = ButtonStyle.orange,
		className,
	} = props;
	const [isEditing, setEditing] = useState<boolean>();

	useEffect(() => {
		if (isEditing || confirmDisabled) return;
		setEditing(true);
	}, [confirmDisabled]);

	return (
		<div className={className}>
			<div
				className={classNames("buttons", {
					appear: !confirmDisabled,
					disappear: isEditing && confirmDisabled,
				})}
			>
				{!confirmDisabled && (
					<>
						<Button
							disabled={confirmDisabled}
							buttonStyle={ButtonStyle.underline}
							textSize={TextSize.S}
							onClick={onCancel}
							isEmUnits={true}
						>
							<span>{t("cancel")}</span>
						</Button>

						<Button
							disabled={confirmDisabled}
							buttonStyle={style}
							textSize={TextSize.S}
							onClick={onConfirm}
							isEmUnits={true}
						>
							<span>{confirmButtonText}</span>
						</Button>
					</>
				)}
			</div>
		</div>
	);
};

export default styled(EditorButtons)`
	.buttons {
		font-size: 1em;
		gap: 1.2rem;
		display: flex;
		align-items: center;
		flex-direction: row;
		-webkit-box-pack: center;
		justify-content: flex-end;
		transition: all 0.15s forwards;
		opacity: 0;
		height: 0;
	}

	.appear {
		animation: slideDown 0.15s forwards;
	}

	.disappear {
		animation: slideUp 0.15s forwards;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
			height: 2.6em;
		}
	}

	@keyframes slideUp {
		from {
			opacity: 1;
			height: 2.6em;
		}
		to {
			opacity: 0;
			height: 0;
		}
	}
`;
