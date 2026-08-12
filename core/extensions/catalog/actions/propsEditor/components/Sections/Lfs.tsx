import TagInputWithKeyboard from "@components/Atoms/TagInputWithKeyboard";
import { DEFAULT_LFS_PATTERNS } from "@core/GitLfs/options";
import Workspace from "@core-ui/ContextServices/Workspace";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { SectionContainer } from "@ext/catalog/actions/propsEditor/components/Sections/SectionContainer";
import t from "@ext/localization/locale/translate";
import { useSetting } from "@ext/settings/logic/hooks";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import { IconButton } from "@ui-kit/Button";
import { FormField } from "@ui-kit/Form";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import type { UseFormReturn } from "react-hook-form";
import type { FormData, FormProps } from "../../logic/createFormSchema";

export type LfsProps = {
	form: UseFormReturn<FormData>;
	formProps: FormProps;
};

export const EditLfsProps = ({ form, formProps }: LfsProps) => {
	const sourceName = useCatalogPropsStore((state) => state.data?.sourceName);
	const { sourceType } = getPartGitSourceDataByStorageName(sourceName);
	const hasWorkspaceDefinedPatterns = Workspace.current().git?.lfs?.patterns?.length > 0;
	const [language] = useSetting("general.language");
	const readonly = !sourceType || hasWorkspaceDefinedPatterns;

	return (
		<SectionContainer>
			<FormField
				{...formProps}
				control={({ field }) => (
					<div className="flex w-full items-start gap-1">
						<div className="min-w-0 flex-1">
							<TagInputWithKeyboard
								onChange={(values) => field.onChange(values)}
								placeholder={t("forms.catalog-edit-props.props.lfs.patterns.placeholder")}
								readonly={readonly}
								value={field.value || []}
							/>
						</div>
						{!readonly && (
							<div className="flex items-center pt-1.5">
								<Tooltip>
									<TooltipTrigger>
										<IconButton
											className="p-0"
											icon="stamp"
											onClick={(ev) => {
												ev.preventDefault();
												form.setValue("lfs.patterns", DEFAULT_LFS_PATTERNS);
											}}
											size="xs"
											type="button"
											variant="text"
										/>
									</TooltipTrigger>
									<TooltipContent>
										{t("forms.catalog-edit-props.props.lfs.patterns.default-tooltip")}
									</TooltipContent>
								</Tooltip>

								<Tooltip>
									<TooltipTrigger>
										<IconButton
											className="p-0"
											icon="trash"
											onClick={(ev) => {
												ev.preventDefault();
												form.setValue("lfs.patterns", []);
											}}
											size="sm"
											type="button"
											variant="text"
										/>
									</TooltipTrigger>
									<TooltipContent>{t("clear")}</TooltipContent>
								</Tooltip>
							</div>
						)}
					</div>
				)}
				description={
					<>
						{t("forms.catalog-edit-props.props.lfs.patterns.description")}
						<a
							className="pl-1 !text-[color:var(--color-link)]"
							href={
								language === "ru"
									? "https://gram.ax/resources/docs/storage/git-lfs"
									: "https://gram.ax/resources/docs/en/storage/git-lfs"
							}
							rel="noopener noreferrer"
							target="_blank"
						>
							{t("more")}
						</a>
					</>
				}
				labelClassName="w-full"
				layout="vertical"
				name="lfs.patterns"
				title={t("forms.catalog-edit-props.props.lfs.patterns.name")}
			/>
		</SectionContainer>
	);
};
