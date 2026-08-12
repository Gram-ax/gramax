import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import t from "@ext/localization/locale/translate";
import PrintView from "@ext/print/components/PrintView";
import { useExportPdf } from "@ext/print/components/useExportPdf";
import type { PdfPrintParams } from "@ext/print/types";
import { nextFrame } from "@ext/print/utils/pagination/scheduling";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertIcon, AlertTitle } from "@ui-kit/Alert";
import { Button } from "@ui-kit/Button";
import { CheckboxField } from "@ui-kit/Checkbox";
import { Collapsible, CollapsibleContent } from "@ui-kit/Collapsible";
import { Dialog, DialogBody, DialogContent } from "@ui-kit/Dialog";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { FieldLabel } from "@ui-kit/Label";
import { Loader } from "@ui-kit/Loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { type DOMAttributes, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
		const props = localStorage.getItem("exportPdfProps") as unknown as string;
		return props ? JSON.parse(props) : { titlePage: false, tocPage: false, titleNumber: false };
	},
	setProps: (props: PdfPrintParams) => {
		localStorage.setItem("exportPdfProps", JSON.stringify(props));
	},
};

const ExportPdf = (props: ExportPdfProps) => {
	const { templates, onClose, isCategory, catalogProps, itemRefPath, apiUrlCreator } = props;
	const savedProps = localStorageProvider.getProps();
	const defaultValues = {
		...savedProps,
		template: templates.includes(savedProps.template) ? savedProps.template : undefined,
	};
	const {
		open,
		isExporting,
		progressLabel,
		handleProgress,
		handleComplete,
		handleError,
		onOpenChange,
		setIsExporting,
		cancelTaskRef,
	} = useExportPdf({ onClose });
	const exportAbortRef = useRef<AbortController | null>(null);
	const type = !itemRefPath ? "catalog" : isCategory ? "category" : "article";
	const [useTemplate, setUseTemplate] = useState(Boolean(defaultValues.template));

	const schema = z.object({
		titlePage: z.boolean(),
		tocPage: z.boolean(),
		titleNumber: z.boolean(),
		template: z.string().optional(),
	});

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues,
		mode: "onChange",
	});

	const checkboxConfig = [
		{
			name: "titlePage" as const,
			label: t("export.pdf.form.titlePage"),
			description: t("export.pdf.form.titlePageDescription"),
		},
		{
			name: "tocPage" as const,
			label: t("export.pdf.form.tocPage"),
			description: t("export.pdf.form.tocPageDescription"),
		},
		{
			name: "titleNumber" as const,
			label: t("export.pdf.form.titleNumber"),
			description: t("export.pdf.form.titleNumberDescription"),
		},
	];

	const formSubmit: DOMAttributes<HTMLFormElement>["onSubmit"] = (event) => {
		if (isExporting) {
			event?.preventDefault?.();
			return;
		}

		void form.handleSubmit(async (params: PdfPrintParams) => {
			const exportParams = {
				...params,
				template: useTemplate && templates.includes(params.template) ? params.template : undefined,
			};
			exportAbortRef.current?.abort();
			cancelTaskRef.current?.();

			const exportController = new AbortController();
			exportAbortRef.current = exportController;

			localStorageProvider.setProps(exportParams);
			setIsExporting(true);
			handleProgress({ stage: "exporting", ratio: 0 });
			await nextFrame();
			ArticleViewService.setBottomView(() => (
				<PrintView
					apiUrlCreator={apiUrlCreator}
					catalogProps={catalogProps}
					exportSignal={exportController.signal}
					isCategory={isCategory}
					itemPath={itemRefPath}
					onCancelRef={(fn) => {
						if (!fn) {
							cancelTaskRef.current = null;
							exportAbortRef.current = null;
							return;
						}

						cancelTaskRef.current = () => {
							const controller = exportAbortRef.current;
							if (controller && !controller.signal.aborted) {
								controller.abort();
							}
							fn();
						};
					}}
					onComplete={handleComplete}
					onError={handleError}
					onProgress={handleProgress}
					params={exportParams}
				/>
			));
		})(event);
	};

	return (
		<Dialog className="print:hidden" onOpenChange={onOpenChange} open={open}>
			<DialogContent data-modal-root>
				<Form asChild {...form}>
					<form onSubmit={formSubmit}>
						<FormHeader
							description={
								<div>
									{t("export.pdf.form.description")}{" "}
									<a
										href="https://gram.ax/resources/docs/collaboration/export-docx-pdf/app"
										rel="noreferrer"
										target="_blank"
									>
										{t("more")}
									</a>
								</div>
							}
							icon="file-text"
							title={t(`export.pdf.form.title.${type}`)}
						/>
						<DialogBody>
							<FormStack>
								<div className="flex flex-col gap-6">
									<div className="space-y-3">
										<FieldLabel>{t("export.pdf.form.sectionTitle")}</FieldLabel>
										<div className="space-y-5 lg:space-y-4 p-2.5">
											{checkboxConfig.map((cfg) => (
												<Controller
													control={form.control}
													key={cfg.name}
													name={cfg.name}
													render={({ field: { value, onChange, name } }) => (
														<CheckboxField
															checked={!!value}
															className="items-start"
															description={cfg.description}
															disabled={isExporting}
															label={cfg.label}
															name={name}
															onCheckedChange={(checked) => onChange(!!checked)}
														/>
													)}
												/>
											))}
											{templates?.length > 0 && (
												<CheckboxField
													checked={useTemplate}
													className="items-start"
													description={t("export.pdf.form.templateDescription.body")}
													disabled={isExporting}
													label={t("export.pdf.form.template")}
													name="useTemplate"
													onCheckedChange={(checked) => {
														const shouldUseTemplate = !!checked;
														setUseTemplate(shouldUseTemplate);
														if (!shouldUseTemplate) form.setValue("template", undefined);
													}}
												/>
											)}
										</div>

										{templates?.length > 0 && (
											<Collapsible open={useTemplate}>
												<CollapsibleContent>
													<FormField
														control={({ field }) => (
															<Select
																disabled={isExporting}
																onValueChange={field.onChange}
																value={field.value || undefined}
															>
																<SelectTrigger
																	onClear={
																		field.value
																			? () => field.onChange(undefined)
																			: undefined
																	}
																	type="button"
																>
																	<SelectValue placeholder={t("no-selected")} />
																</SelectTrigger>
																<SelectContent>
																	{templates.map((template, idx) => (
																		<SelectItem
																			data-qa={"qa-clickable"}
																			key={idx + template}
																			value={template}
																		>
																			{template}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
														)}
														description={
															<div>
																{t("export.pdf.form.templateDescription.body")}{" "}
																<a
																	href="https://gram.ax/resources/docs/collaboration/export-docx-pdf/add-custom-template/pdf"
																	rel="noreferrer"
																	target="_blank"
																>
																	{t("more")}
																</a>
															</div>
														}
														layout="vertical"
														name="template"
														title={t("export.pdf.form.template")}
													/>
												</CollapsibleContent>
											</Collapsible>
										)}
									</div>
									<Alert>
										<AlertIcon icon="file" />
										<AlertTitle className="font-normal">
											{t("export.pdf.form.printDialog")}
										</AlertTitle>
									</Alert>
								</div>
							</FormStack>
						</DialogBody>
						<FormFooter
							className="flex flex-col gap-4"
							primaryButton={
								<Button
									disabled={isExporting}
									startIcon={!isExporting ? "printer" : null}
									type="submit"
									variant="primary"
								>
									{!isExporting ? (
										t("export.pdf.form.openPrint")
									) : (
										<div className="flex flex-row items-center">
											<Loader className="pl-1 text-inverse" />
											<span className="text-sm">{progressLabel}</span>
										</div>
									)}
								</Button>
							}
							secondaryButton={
								<Button onClick={() => onOpenChange(false)} type="button" variant="outline">
									{t("close")}
								</Button>
							}
						/>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default ExportPdf;
