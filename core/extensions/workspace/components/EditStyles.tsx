import PureLink, { LinkTheme } from "@components/Atoms/PureLink";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { Button } from "@ui-kit/Button";
import FileInput from "@components/Atoms/FileInput/FileInput";
import t from "@ext/localization/locale/translate";
import { FormHeader, FormFooter, FormStack } from "@ui-kit/Form";
import { useCallback, useState, ReactElement } from "react";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import LanguageService from "@core-ui/ContextServices/Language";

interface EditStylesProps {
	children: ReactElement;
	customCss?: string;
	setCustomCss?: (css: string) => void;
	revertCustomCss?: () => void;
	className?: string;
}

const useModalDescription = () => {
	const mainText = t("workspace.css-configuration-instruction") || "";
	const linkText = t("workspace.instruction");
	const { isTauri } = usePlatform();
	const lang = LanguageService.currentUi();
	const isRuLang = lang === "ru";

	const textOnTwoParts = mainText.split("{{instruction}}");

	const description = (
		<span>
			{textOnTwoParts[0]}
			<PureLink
				href={
					isRuLang
						? "https://gram.ax/resources/docs/space/css-styles"
						: "https://gram.ax/resources/docs/en/space/css-styles"
				}
				target={isTauri ? "_self" : "_blank"}
				linkTheme={LinkTheme.DEFAULT}
			>
				{linkText}
			</PureLink>
			{textOnTwoParts[1]}
		</span>
	);

	return { description };
};

const EditStyles = ({ children, customCss, setCustomCss, revertCustomCss }: EditStylesProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const { description } = useModalDescription();

	const closeEditor = useCallback(() => {
		setIsOpen(false);
	}, []);

	const cancelEdit = useCallback(() => {
		revertCustomCss();
		setIsOpen(false);
	}, [revertCustomCss]);

	const onOpenChange = useCallback((value) => {
		setIsOpen(value);
	}, []);

	return (
		<Modal open={isOpen} onOpenChange={onOpenChange}>
			{children && <ModalTrigger asChild>{children}</ModalTrigger>}
			<ModalContent className={"monaco-form-old-width"} data-modal-root data-monaco-modal-normal-width>
				<FormHeader title={t("workspace.editing-css")} description={description as any} icon={"palette"} />
				<ModalBody>
					<FormStack>
						<FileInput
							style={{ padding: undefined }}
							language={"css"}
							value={customCss}
							onChange={setCustomCss}
							height={"min(calc(650px - 2.5rem), calc(60vh - 2.5rem))"}
							uiKitTheme
						/>
					</FormStack>
				</ModalBody>
				<FormFooter
					primaryButton={<Button variant="primary" onClick={closeEditor} children={t("continue")} />}
					secondaryButton={<Button onClick={cancelEdit} variant="text" children={t("cancel")} />}
				/>
			</ModalContent>
		</Modal>
	);
};

export default EditStyles;
