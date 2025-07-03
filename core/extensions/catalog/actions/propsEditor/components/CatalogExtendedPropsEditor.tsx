import ModalErrorHandler from "@ext/errorHandlers/client/components/ModalErrorHandler";
import { FormEvent, ReactElement, useMemo, useState } from "react";
import Schema from "../model/CatalogExtendedEditProps.schema.json";
import CatalogExtendedEditProps from "@ext/catalog/actions/propsEditor/model/CatalogExtendedEditProps.schema";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import t from "@ext/localization/locale/translate";
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle, ModalTrigger } from "@ui-kit/Modal";
import { Button } from "@ui-kit/Button";
import { Form, FormField, FormFooter, FormStack } from "@ui-kit/Form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { refreshPage } from "@core-ui/utils/initGlobalFuncs";

const formSchema = z.object({
	syntax: z.optional(z.string().nullable()),
});

const useFormSelectValues = () => {
	const syntaxes = useMemo<{ value: string; children: string }[]>(
		() =>
			Schema.properties.syntax.enum.map((syntax) => {
				return { value: syntax, children: `${syntax}` };
			}),
		[],
	);
	return { syntaxes };
};

const CatalogExtendedPropsEditor = ({ trigger }: { trigger: ReactElement }) => {
	const [open, setOpen] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const catalogProps = CatalogPropsService.value;

	const { syntaxes } = useFormSelectValues();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: Object.assign({}, { syntax: catalogProps.syntax }) as any,
	});

	const setSyntax = async ({ syntax }: CatalogExtendedEditProps) => {
		await FetchService.fetch(apiUrlCreator.setSyntax(syntax));
		CatalogPropsService.value = { ...catalogProps, syntax };
		setOpen(false);
		refreshPage();
	};

	const formSubmit = (e: FormEvent<HTMLFormElement>) => {
		form.handleSubmit(setSyntax)(e);
		e.stopPropagation();
	};

	return (
		<Modal open={open} onOpenChange={setOpen}>
			{trigger && <ModalTrigger asChild>{trigger}</ModalTrigger>}
			<ModalContent>
				<ModalErrorHandler onError={() => {}} onClose={() => setOpen(false)}>
					<Form asChild {...form}>
						<form className="contents ui-kit" onSubmit={formSubmit}>
							<ModalHeader>
								<ModalTitle>{t("forms.catalog-extended-edit-props.name")}</ModalTitle>
							</ModalHeader>
							<ModalBody>
								<FormStack>
									<FormField
										name="syntax"
										title={t("forms.catalog-extended-edit-props.props.syntax.name")}
										description={t("forms.catalog-extended-edit-props.props.syntax.description")}
										control={({ field }) => (
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value || undefined}
											>
												<SelectTrigger
													data-qa={t("forms.catalog-extended-edit-props.props.syntax.name")}
												>
													<SelectValue
														placeholder={t(
															"forms.catalog-extended-edit-props.props.syntax.placeholder",
														)}
													/>
												</SelectTrigger>
												<SelectContent>
													{syntaxes.map(({ value, children }) => (
														<SelectItem
															data-qa={"qa-clickable"}
															key={value}
															children={children}
															value={value}
														/>
													))}
												</SelectContent>
											</Select>
										)}
										labelClassName="w-44"
									/>
								</FormStack>
							</ModalBody>
							<FormFooter primaryButton={<Button hidden variant="primary" children={t("save")} />} />
						</form>
					</Form>
				</ModalErrorHandler>
			</ModalContent>
		</Modal>
	);
};

export default CatalogExtendedPropsEditor;
