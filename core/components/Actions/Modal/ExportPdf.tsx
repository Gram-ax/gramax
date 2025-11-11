import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
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
import styled from "@emotion/styled";
import { Loader } from "ics-ui-kit/components/loader";
import { Controller, useForm } from "react-hook-form";
import { useRef } from "react";
import { z } from "zod";
import { useExportPdf } from "@ext/print/components/useExportPdf";
import { nextFrame } from "@ext/print/utils/pagination/scheduling";

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
					isCategory={isCategory}
					catalogProps={catalogProps}
					itemPath={itemRefPath}
					apiUrlCreator={apiUrlCreator}
					params={params}
					onProgress={handleProgress}
					onComplete={handleComplete}
					onError={handleError}
					exportSignal={exportController.signal}
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
				/>
			));
		})(event);
	};

	return (
		<StyledModal open={open} onOpenChange={onOpenChange}>
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
								{checkboxConfig.map((cfg) => (
									<Controller
										key={cfg.name}
										name={cfg.name}
										control={form.control}
										render={({ field: { value, onChange, name } }) => (
											<CheckboxField
												className="gap-2 items-start"
												name={name}
												checked={!!value}
												onCheckedChange={(checked) => onChange(!!checked)}
												label={cfg.label}
												description={cfg.description}
												disabled={isExporting}
											/>
										)}
									/>
								))}

								{templates.length > 0 && (
									<FormField
										name="template"
										layout="vertical"
										title={t("export.pdf.form.template")}
										description={t("export.pdf.form.templateDescription")}
										control={({ field }) => (
											<Select
												value={field.value || undefined}
												onValueChange={field.onChange}
												disabled={isExporting}
											>
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
						<>
							<FormFooter
								leftContent={
									isExporting ? (
										<div className="flex flex-row items-center">
											<Loader />
											<span className="text-sm text-primary-fg">{progressLabel}</span>
										</div>
									) : undefined
								}
								primaryButton={
									<Button type="submit" variant="primary" disabled={isExporting}>
										{t("export.name")}
									</Button>
								}
								secondaryButton={
									<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
										{t("close")}
									</Button>
								}
							/>
						</>
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
