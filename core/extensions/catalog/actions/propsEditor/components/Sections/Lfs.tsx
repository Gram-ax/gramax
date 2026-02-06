import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import { IconButton } from "@ui-kit/Button";
import { FormField } from "@ui-kit/Form";
import { TagInput } from "@ui-kit/TagInput";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import type { UseFormReturn } from "react-hook-form";
import type { FormData, FormProps } from "../../logic/createFormSchema";

export type LfsProps = {
	form: UseFormReturn<FormData>;
	formProps: FormProps;
};

const StyledFormField = styled(FormField)`
	> div {
		width: 100%;

		> label {
			width: 100%;

			> span {
				width: 100%;
			}
		}

		> div {
			width: 100%;
		}
	}
`;

const DEFAULT_LFS_PATTERNS = [
	"*.jpg",
	"*.png",
	"*.webp",
	"*.gif",

	"*.mp4",
	"*.wmv",
	"*.avi",
	"*.mov",
	"*.mkv",
	"*.webm",
	"*.mpg",
	"*.mpeg",

	"*.pdf",
	"*.doc",
	"*.docx",
	"*.xls",
	"*.xlsx",
	"*.ppt",
	"*.pptx",

	"*.zip",
	"*.rar",
	"*.7z",
	"*.tar",
	"*.gz",
	"*.bz2",
];

export const EditLfsProps = ({ form, formProps }: LfsProps) => {
	const sourceName = useCatalogPropsStore((state) => state.data?.sourceName);
	const { sourceType } = getPartGitSourceDataByStorageName(sourceName);

	return (
		<>
			<StyledFormField
				{...formProps}
				control={({ field }) => (
					<TagInput
						onChange={(values) => field.onChange(values)}
						placeholder={t("forms.catalog-edit-props.props.lfs.patterns.placeholder")}
						readonly={!sourceType}
						value={field.value || []}
					/>
				)}
				description={t("forms.catalog-edit-props.props.lfs.patterns.description")}
				labelClassName="w-full"
				layout="vertical"
				name="lfs.patterns"
				title={
					<div className="flex gap-2 justify-between items-center">
						{t("forms.catalog-edit-props.props.lfs.patterns.name")}
						<div className="flex items-center">
							<Tooltip>
								<TooltipTrigger>
									<IconButton
										className="p-0"
										icon="rotate-cw"
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
										icon="x"
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
					</div>
				}
			/>
		</>
	);
};
