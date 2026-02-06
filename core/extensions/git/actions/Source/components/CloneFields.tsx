import Date from "@components/Atoms/Date";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import useWatch from "@core-ui/hooks/useWatch";
import { cssMedia } from "@core-ui/utils/cssUtils";
import GitPaginatedProjectList from "@ext/git/actions/Source/Git/logic/GitPaginatedProjectList";
import GitRepsModelState from "@ext/git/actions/Source/Git/model/GitRepsModelState";
import t from "@ext/localization/locale/translate";
import { SelectFormSchemaType } from "@ext/storage/logic/SourceDataProvider/model/SelectSourceFormSchema";
import { useMediaQuery } from "@mui/material";
import { LazySearchSelect, RenderOptionProps } from "@ui-kit/LazySearchSelect";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { useEffect, useRef, useState } from "react";
import { ControllerRenderProps, FieldValues, UseFormReturn } from "react-hook-form";
import GitSourceData from "../../../core/model/GitSourceData.schema";

interface CloneFieldsProps extends ControllerRenderProps<FieldValues, string> {
	source: GitSourceData;
	deps?: any[];
	form: UseFormReturn<SelectFormSchemaType>;
	repositoryFilter?: (repository: CloneListItem) => boolean;
	gitPaginatedProjectList: GitPaginatedProjectList;
}

export type CloneListItem = {
	path: string;
	date: number;
};

type Option = CloneListItem & {
	label: string;
	value: string;
};

const CloneFields = (props: CloneFieldsProps) => {
	const { gitPaginatedProjectList, deps, repositoryFilter, form, ...rest } = props;
	const value = form.watch("repository") as Option;
	const isMobile = useMediaQuery(cssMedia.JSmediumest);

	const [options, setOptions] = useState<Option[]>([]);
	const stateRef = useRef<GitRepsModelState>("notLoaded");
	const modelRef = useRef<CloneListItem[]>([]);

	useWatch(() => {
		form.resetField("repository");
	}, [deps]);

	useEffect(() => {
		if (!gitPaginatedProjectList) return;
		gitPaginatedProjectList.onPagesFetched((model, state) => {
			stateRef.current = state;
			modelRef.current = model;

			setOptions(
				model
					.filter(Boolean)
					.filter((repository) => (repositoryFilter ? repositoryFilter(repository) : true))
					.map((repository) => ({
						value: repository.path,
						label: repository.path,
						...repository,
					})),
			);
		});
		gitPaginatedProjectList.startLoading();
	}, [gitPaginatedProjectList]);

	return (
		<LazySearchSelect
			{...rest}
			emptyMessage={
				stateRef.current === "loading" ? (
					<div className="flex items-center justify-center gap-2">
						<SpinnerLoader height={15} width={15} />
						{t("loading")}
					</div>
				) : undefined
			}
			onChange={(value) => rest.onChange?.({ path: value, lastActivity: undefined })}
			options={options}
			placeholder={`${t("find")} ${t("repository2")}`}
			renderOption={(data: RenderOptionProps<Option>) => {
				const { option, type } = data;

				if (type === "trigger") {
					return <TextOverflowTooltip data-qa="qa-clickable self-center">{option.label}</TextOverflowTooltip>;
				}

				return (
					<div
						className="flex items-center gap-2 justify-between w-full"
						style={!isMobile ? { maxWidth: "288px", width: "288px" } : undefined}
					>
						<TextOverflowTooltip className="flex-1">{option.label}</TextOverflowTooltip>
						<Date className="text-muted" date={option.date} />
					</div>
				);
			}}
			value={value?.value || null}
		/>
	);
};

export default CloneFields;
