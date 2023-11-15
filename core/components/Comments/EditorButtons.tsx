import styled from "@emotion/styled";
import useLocalize from "../../extensions/localization/useLocalize";
import Button from "../Atoms/Button/Button";
import { ButtonStyle } from "../Atoms/Button/ButtonStyle";

const EditorButtons = styled(
	({
		confirmButtonText,
		onCancel,
		onConfirm,
		style = ButtonStyle.orange,
		className,
	}: {
		confirmButtonText: string;
		onCancel: () => void;
		onConfirm: () => void;
		style?: ButtonStyle;
		className?: string;
	}) => {
		return (
			<div className={className}>
				<div className="buttons">
					<Button buttonStyle={ButtonStyle.transparent} onClick={onCancel}>
						<span>{useLocalize("cancel")}</span>
					</Button>

					<Button buttonStyle={style} onClick={onConfirm}>
						<span>{confirmButtonText}</span>
					</Button>
				</div>
			</div>
		);
	},
)`
	.buttons {
		gap: 1.2rem;
		display: flex;
		margin-top: 1rem;
		align-items: center;
		flex-direction: row;
		-webkit-box-pack: center;
		justify-content: flex-end;
	}
`;

export default EditorButtons;
