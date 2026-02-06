import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import PrintView from "@ext/print/components/PrintView";
import { useExportPdf } from "@ext/print/components/useExportPdf";
import type { PdfPrintParams } from "@ext/print/types";
import { nextFrame } from "@ext/print/utils/pagination/scheduling";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { CheckboxField } from "@ui-kit/Checkbox";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Loader } from "@ui-kit/Loader";
import { Modal, ModalBody, ModalContent } from "@ui-kit/Modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { useRef } from "react";
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

	const formSubmit = (event) => {
		if (isExporting) {
			event?.preventDefault?.();
			return;
		}

		form.handleSubmit(async (params: PdfPrintParams) => {
			exportAbortRef.current?.abort();
			cancelTaskRef.current?.();

			const exportController = new AbortController();
			exportAbortRef.current = exportController;

			localStorageProvider.setProps(params);
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
					params={params}
				/>
			));
		})(event);
	};

	return (
		<StyledModal onOpenChange={onOpenChange} open={open}>
			<ModalContent data-modal-root>
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
							title={t("export.pdf.form.title")}
						/>
						<ModalBody>
							<FormStack>
								{checkboxConfig.map((cfg) => (
									<Controller
										control={form.control}
										key={cfg.name}
										name={cfg.name}
										render={({ field: { value, onChange, name } }) => (
											<CheckboxField
												checked={!!value}
												className="gap-2 items-start"
												description={cfg.description}
												disabled={isExporting}
												label={cfg.label}
												name={name}
												onCheckedChange={(checked) => onChange(!!checked)}
											/>
										)}
									/>
								))}

								{templates.length > 0 && (
									<FormField
										control={({ field }) => (
											<Select
												disabled={isExporting}
												onValueChange={field.onChange}
												value={field.value || null}
											>
												<SelectTrigger
													onClear={field.value ? () => field.onChange(null) : undefined}
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
													href="https://gram.ax/resources/docs/collaboration/export-docx-pdf/add-custom-template-docx/pdf"
													rel="noreferrer"
													target="_blank"
												>
													{t("export.pdf.form.templateDescription.more")}
												</a>
											</div>
										}
										layout="vertical"
										name="template"
										title={t("export.pdf.form.template")}
									/>
								)}
							</FormStack>
						</ModalBody>
						<FormFooter
							className="flex flex-col gap-4"
							leftContent={
								isExporting ? (
									<div className="flex flex-row items-center">
										<Loader className="pl-1" />
										<span className="text-sm text-primary-fg">{progressLabel}</span>
									</div>
								) : undefined
							}
							primaryButton={
								<Button disabled={isExporting} type="submit" variant="primary">
									{t("export.name")}
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
			</ModalContent>
		</StyledModal>
	);
};

const StyledModal = styled(Modal)`
	@media print {
		display: none !important;
	}
`;

export default ExportPdf;
