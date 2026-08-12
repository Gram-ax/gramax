import { ColorTilePicker } from "@components/Atoms/ColorTilePicker";
import Style from "@components/HomePage/Cards/model/Style";
import { cn } from "@core-ui/utils/cn";
import { CatalogCardPreview } from "@ext/catalog/actions/propsEditor/components/CatalogCardPreview";
import UploadCatalogLogo from "@ext/catalog/actions/propsEditor/components/UploadCatalogLogo";
import t from "@ext/localization/locale/translate";
import { InlineTriggerButton } from "@ui-kit/Button";
import { usePreventAutoFocusToInput } from "@ui-kit/Dialog/utils";
import { Divider } from "@ui-kit/Divider";
import { FormBody, FormField, FormStack } from "@ui-kit/Form";
import { Icon } from "@ui-kit/Icon";
import { Input } from "@ui-kit/Input";
import { Popover, PopoverContent, PopoverTriggerButton } from "@ui-kit/Popover";
import { Textarea } from "@ui-kit/Textarea";
import { TextOverflowTooltip, Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import type { UseFormReturn } from "react-hook-form";
import { FORM_DATA_QA } from "../../consts/form";
import type { FormData, FormProps } from "../../logic/createFormSchema";

export type BasicProps = {
	formProps: FormProps;
	form: UseFormReturn<FormData>;
};

export const EditBasicProps = ({ formProps, form }: BasicProps) => {
	const { inputRef } = usePreventAutoFocusToInput(true);

	return (
		<>
			<FormBody>
				<FormStack>
					<FormField
						control={({ field }) => (
							<Input
								data-qa={FORM_DATA_QA.TITLE}
								placeholder={t("forms.catalog-edit-props.props.title.placeholder")}
								{...field}
								ref={inputRef}
							/>
						)}
						description={t("forms.catalog-edit-props.props.title.description")}
						name="title"
						required
						title={t("forms.catalog-edit-props.props.title.name")}
						{...formProps}
					/>
					<FormField
						control={({ field }) => (
							<Textarea
								data-qa={FORM_DATA_QA.DESCRIPTION}
								placeholder={t("forms.catalog-edit-props.props.description.placeholder")}
								{...field}
							/>
						)}
						description={t("forms.catalog-edit-props.props.description.description")}
						name="description"
						title={t("forms.catalog-edit-props.props.description.name")}
						{...formProps}
					/>

					<FormField
						control={({ field }) => (
							<Popover>
								<PopoverTriggerButton
									className={cn(
										"w-full justify-start pr-2.5 pl-3 py-1.5 font-normal",
										!field.value && "text-muted",
									)}
									containerClassName="w-full justify-start"
									variant="outline"
								>
									<Icon className="shrink-0" icon="palette" />
									<TextOverflowTooltip>
										{t(
											field.value
												? (`catalog.style.${field.value}` as keyof typeof t)
												: "forms.catalog-edit-props.props.style.placeholder",
										)}
									</TextOverflowTooltip>
									<div className="flex items-center ml-auto">
										{field.value && (
											<InlineTriggerButton
												className="shrink-0"
												onClick={() => field.onChange(null)}
											/>
										)}
										<Tooltip>
											<TooltipContent>{t("pick-random-value")}</TooltipContent>
											<TooltipTrigger asChild>
												<span>
													<InlineTriggerButton
														className="shrink-0"
														icon="dices"
														onClick={() => {
															const randomStyle = Object.values(Style).at(
																Math.floor(Math.random() * Object.values(Style).length),
															);
															field.onChange(randomStyle);
														}}
													/>
												</span>
											</TooltipTrigger>
										</Tooltip>
										<span className="text-muted pl-2 shrink-0 aspect-square inline-flex items-center justify-center">
											<Icon icon="chevron-down" />
										</span>
									</div>
								</PopoverTriggerButton>
								<PopoverContent className="p-0 w-auto rounded-xl">
									<ColorTilePicker onChange={field.onChange} value={field.value} />
								</PopoverContent>
							</Popover>
						)}
						description={t("forms.catalog-edit-props.props.style.description")}
						name="style"
						title={t("forms.catalog-edit-props.props.style.name")}
						{...formProps}
					/>

					<UploadCatalogLogo form={form} formProps={formProps} />
				</FormStack>
			</FormBody>
			<Divider />
			<div className="px-4 py-5 lg:p-6">
				<FormStack>
					<CatalogCardPreview form={form} />
				</FormStack>
			</div>
		</>
	);
};
