import ButtonLink from "@components/Molecules/ButtonLink";
import ModalErrorHandler from "@ext/errorHandlers/client/components/ModalErrorHandler";
import {
	UsePropsEditorActionsParams,
	usePropsEditorActions,
} from "@ext/item/actions/propsEditor/logic/usePropsEditorAcitions";
import { Modal, ModalTrigger, ModalContent, ModalBody } from "@ui-kit/Modal";
import { Button } from "@ui-kit/Button";
import { Input } from "@ui-kit/Input";
import { Form, FormField, FormHeader, FormFooter, FormStack } from "@ui-kit/Form";
import OtherLanguagesPresentWarning from "@ext/localization/actions/OtherLanguagesPresentWarning";
import t from "@ext/localization/locale/translate";
import { FC, useRef, useCallback } from "react";

interface PropsEditorProps extends Omit<UsePropsEditorActionsParams, "onExternalClose"> {
	openExternally?: boolean;
	onOpenChange?: (open: boolean) => void;
}

const PropsEditor: FC<PropsEditorProps> = (props) => {
	const { openExternally, onOpenChange, ...hookParams } = props;
	const formRef = useRef<HTMLFormElement>(null);

	const { open, setOpen, openModal, form, handleSubmit, submit, isOnlyTitleChanged, catalogProps } =
		usePropsEditorActions({
			...hookParams,
			onExternalClose: () => onOpenChange?.(false),
		});

	if (typeof openExternally === "boolean" && openExternally !== open) {
		setOpen(openExternally);
	}

	const formSubmitHandler = useCallback(
		(e) => {
			handleSubmit(submit)(e);
		},
		[handleSubmit, submit],
	);

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalTrigger asChild>
				<ButtonLink onClick={openModal} iconCode="pencil" text={t("configure")} />
			</ModalTrigger>

			<ModalContent data-modal-root>
				<ModalErrorHandler onError={() => {}} onClose={() => setOpen(false)}>
					<Form asChild {...form}>
						<form ref={formRef} className="contents ui-kit" onSubmit={formSubmitHandler}>
							<FormHeader
								icon={"settings"}
								title={t(`${hookParams.isCategory ? "section" : "article"}.configure.title`)}
								description={t(
									`${hookParams.isCategory ? "section" : "article"}.configure.description`,
								)}
							/>
							<ModalBody>
								<FormStack>
									<FormField
										name="title"
										required
										title={t("title")}
										control={({ field }) => (
											<Input
												placeholder={t("enter-value")}
												data-qa={t("title")}
												{...field}
												autoFocus
											/>
										)}
										labelClassName={"w-44"}
									/>

									<FormField
										name="fileName"
										required
										title={t("article-url.title")}
										description={t("article-url.description")}
										control={({ field, fieldState }) => (
											<Input
												data-qa="URL"
												error={fieldState?.error?.message}
												placeholder={t("enter-value")}
												{...field}
											/>
										)}
										labelClassName={"w-44"}
									/>
								</FormStack>
							</ModalBody>

							<FormFooter
								primaryButton={
									isOnlyTitleChanged ? (
										<Button type="submit">{t("save")}</Button>
									) : (
										<OtherLanguagesPresentWarning
											catalogProps={catalogProps}
											action={formSubmitHandler}
										>
											<Button type="button">{t("save")}</Button>
										</OtherLanguagesPresentWarning>
									)
								}
							/>
						</form>
					</Form>
				</ModalErrorHandler>
			</ModalContent>
		</Modal>
	);
};

export default PropsEditor;
