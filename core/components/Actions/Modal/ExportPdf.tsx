import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import t from "@ext/localization/locale/translate";
import PrintView from "@ext/print/components/PrintView";
import { PdfPrintParams } from "@ext/print/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { CheckboxField } from "@ui-kit/Checkbox";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Modal, ModalBody, ModalContent } from "@ui-kit/Modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface ExportPdfProps {
	onClose?: () => void;
	catalogProps: ClientCatalogProps;
	itemRefPath: string;
	isCategory: boolean;
	apiUrlCreator: ApiUrlCreator;
	templates: string[];
}

const localStorageProvider = {
	getProps: (): PdfPrintParams => {
		const props = localStorage.getItem("exportPdfProps");
		return props ? JSON.parse(props) : { titlePage: false, tocPage: false, titleNumber: false };
	},
	setProps: (props: PdfPrintParams) => {
		localStorage.setItem("exportPdfProps", JSON.stringify(props));
	},
};

const ExportPdf = (props: ExportPdfProps) => {
	const { templates, onClose, isCategory, catalogProps, itemRefPath, apiUrlCreator } = props;
	const [open, setOpen] = useState(true);

	const schema = z.object({
		titlePage: z.boolean(),
		tocPage: z.boolean(),
		titleNumber: z.boolean(),
		template: z.string().optional(),
	});

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: localStorageProvider.getProps(),
		mode: "onChange",
	});

	const formSubmit = (e) => {
		form.handleSubmit((params: PdfPrintParams) => {
			localStorageProvider.setProps(params);
			ModalToOpenService.resetValue();
			ArticleViewService.setBottomView(() => (
				<PrintView
					isCategory={isCategory}
					catalogProps={catalogProps}
					itemPath={itemRefPath}
					apiUrlCreator={apiUrlCreator}
					params={params}
				/>
			));
		})(e);
	};

	const onOpenChange = (open: boolean) => {
		setOpen(open);
		if (!open) onClose?.();
	};

	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalContent data-modal-root>
				<Form asChild {...form}>
					<form onSubmit={formSubmit}>
						<FormHeader
							icon="file-text"
							title={t("export.pdf.form.title")}
							description={
								<div>
									{t("export.pdf.form.description")}{" "}
									<a
										href="https://gram.ax/resources/docs/catalog/export-pdf"
										target="_blank"
										rel="noreferrer"
									>
										{t("more")}
									</a>
								</div>
							}
						/>
						<ModalBody>
							<FormStack>
								<CheckboxField
									className="gap-2 items-start"
									name="titlePage"
									checked={form.watch("titlePage")}
									onCheckedChange={(checked) => form.setValue("titlePage", checked as boolean)}
									label={t("export.pdf.form.titlePage")}
									description={t("export.pdf.form.titlePageDescription")}
								/>
								<CheckboxField
									className="gap-2"
									name="tocPage"
									checked={form.watch("tocPage")}
									onCheckedChange={(checked) => form.setValue("tocPage", checked as boolean)}
									label={t("export.pdf.form.tocPage")}
									description={t("export.pdf.form.tocPageDescription")}
								/>
								<CheckboxField
									className="gap-2"
									name="titleNumber"
									checked={form.watch("titleNumber")}
									onCheckedChange={(checked) => form.setValue("titleNumber", checked as boolean)}
									label={t("export.pdf.form.titleNumber")}
									description={t("export.pdf.form.titleNumberDescription")}
								/>

								{templates.length > 0 && (
									<FormField
										name="template"
										layout="vertical"
										title={t("export.pdf.form.template")}
										description={t("export.pdf.form.templateDescription")}
										control={({ field }) => (
											<Select value={field.value || undefined} onValueChange={field.onChange}>
												<SelectTrigger type="button" onClear={() => field.onChange(null)}>
													<SelectValue placeholder={t("no-selected")} />
												</SelectTrigger>
												<SelectContent>
													{templates.map((template, idx) => (
														<SelectItem
															data-qa={"qa-clickable"}
															key={idx + template}
															children={template}
															value={template}
														/>
													))}
												</SelectContent>
											</Select>
										)}
									/>
								)}
							</FormStack>
						</ModalBody>
						<FormFooter
							primaryButton={<Button variant="primary">{t("export.name")}</Button>}
							secondaryButton={
								<Button variant="outline" onClick={() => onOpenChange(false)}>
									{t("close")}
								</Button>
							}
						/>
					</form>
				</Form>
			</ModalContent>
		</Modal>
	);
};

export default ExportPdf;
