import GitPaginatedProjectList from "@ext/git/actions/Source/Git/logic/GitPaginatedProjectList";
import t from "@ext/localization/locale/translate";
import GitSourceData from "../../../core/model/GitSourceData.schema";
import { LazySearchSelect, RenderOptionProps } from "@ui-kit/LazySearchSelect";
import useWatch from "@core-ui/hooks/useWatch";
import { ControllerRenderProps, FieldValues, UseFormReturn } from "react-hook-form";
import { SelectFormSchemaType } from "@ext/storage/logic/SourceDataProvider/model/SelectSourceFormSchema";
import Date from "@components/Atoms/Date";
import { useEffect, useRef, useState } from "react";
import GitRepsModelState from "@ext/git/actions/Source/Git/model/GitRepsModelState";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";

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
			options={options}
			onChange={(value) => rest.onChange?.({ path: value, lastActivity: undefined })}
			value={value?.value || null}
			emptyMessage={
				stateRef.current === "loading" ? (
					<div className="flex items-center justify-center gap-2">
						<SpinnerLoader width={15} height={15} />
						{t("loading")}
					</div>
				) : undefined
			}
			placeholder={`${t("find")} ${t("repository2")}`}
			renderOption={(data: RenderOptionProps<Option>) => {
				const { option, type } = data;

				if (type === "trigger") {
					return <TextOverflowTooltip data-qa="qa-clickable">{option.label}</TextOverflowTooltip>;
				}

				return (
					<div
						className="flex items-center gap-2 justify-between w-full"
						style={{ maxWidth: "288px", width: "288px" }}
					>
						<TextOverflowTooltip className="flex-1">{option.label}</TextOverflowTooltip>
						<Date date={option.date} className="text-muted" />
					</div>
				);
			}}
		/>
	);
};

export default CloneFields;
