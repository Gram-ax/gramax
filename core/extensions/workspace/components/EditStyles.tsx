import FileInput from "@components/Atoms/FileInput/FileInput";
import PureLink, { LinkTheme } from "@components/Atoms/PureLink";
import LanguageService from "@core-ui/ContextServices/Language";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { ReactElement, useCallback, useState } from "react";

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
				linkTheme={LinkTheme.DEFAULT}
				target={"_blank"}
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
		<Modal onOpenChange={onOpenChange} open={isOpen}>
			{children && <ModalTrigger asChild>{children}</ModalTrigger>}
			<ModalContent className={"monaco-form-old-width"} data-modal-root size="L">
				<FormHeader description={description as any} icon={"palette"} title={t("workspace.editing-css")} />
				<ModalBody>
					<FormStack className="h-full">
						<FileInput
							height={"100%"}
							language={"css"}
							onChange={setCustomCss}
							style={{ padding: undefined }}
							uiKitTheme
							value={customCss}
						/>
					</FormStack>
				</ModalBody>
				<FormFooter
					primaryButton={<Button children={t("continue")} onClick={closeEditor} variant="primary" />}
					secondaryButton={<Button children={t("cancel")} onClick={cancelEdit} variant="text" />}
				/>
			</ModalContent>
		</Modal>
	);
};

export default EditStyles;
