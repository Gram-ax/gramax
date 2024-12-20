import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import FileInput from "@components/Atoms/FileInput/FileInput";
import Icon from "@components/Atoms/Icon";
import IconWithText from "@components/Atoms/Icon/IconWithText";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { useCallback, useState, ReactElement } from "react";

interface EditStylesProps {
	children: ReactElement;
	customCss?: string;
	setCustomCss?: (css: string) => void;
	revertCustomCss?: () => void;
	className?: string;
}

const EditStyles = ({ children, customCss, setCustomCss, revertCustomCss, className }: EditStylesProps) => {
	const [isOpen, setIsOpen] = useState(false);

	const closeEditor = useCallback(() => {
		setIsOpen(false);
	}, []);

	const cancelEdit = useCallback(() => {
		revertCustomCss();
		setIsOpen(false);
	}, [revertCustomCss]);

	const onOpen = useCallback(() => {
		setIsOpen(true);
	}, []);

	return (
		<ModalLayout trigger={children} onOpen={onOpen} contentWidth="L" onClose={closeEditor} isOpen={isOpen}>
			<ModalLayoutLight>
				<FormStyle className={className}>
					<>
						<legend>
							<div className={"edit-css-legend"}>
								<IconWithText iconCode={"palette"} text={t("workspace.editing-css")} />
								<div className={"help-wrapper"}>
									<Icon className={"help-icon"} code={"circle-help"} />
								</div>
							</div>
						</legend>
						<fieldset style={{ height: "60vh" }}>
							<FileInput language={"css"} value={customCss} onChange={setCustomCss} height={"60vh"} />
						</fieldset>
						<div className="buttons">
							<Button buttonStyle={ButtonStyle.underline} onClick={cancelEdit}>
								<span>{t("cancel")}</span>
							</Button>
							<Button buttonStyle={ButtonStyle.default} onClick={closeEditor}>
								<span>{t("continue")}</span>
							</Button>
						</div>
					</>
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default styled(EditStyles)`
	.edit-css-legend {
		display: flex;
		justify-content: start;
		gap: 1rem;
	}

	.help-wrapper {
		font-size: 0.9em;
		color: var(--version-control-primary);
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
	}
`;
