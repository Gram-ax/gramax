import Date from "@components/Atoms/Date";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import useMediaQuery from "@core-ui/hooks/useMediaQuery";
import useWatch from "@core-ui/hooks/useWatch";
import { cssMedia } from "@core-ui/utils/cssUtils";
import type GitPaginatedProjectList from "@ext/git/actions/Source/Git/logic/GitPaginatedProjectList";
import type GitRepsModelState from "@ext/git/actions/Source/Git/model/GitRepsModelState";
import t from "@ext/localization/locale/translate";
import type { SelectFormSchemaType } from "@ext/storage/logic/SourceDataProvider/model/SelectSourceFormSchema";
import { LazySearchSelect, type RenderOptionProps } from "@ui-kit/LazySearchSelect";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { type DependencyList, useEffect, useRef, useState } from "react";
import type { ControllerRenderProps, FieldValues, UseFormReturn } from "react-hook-form";
import type GitSourceData from "../../../core/model/GitSourceData.schema";

interface CloneFieldsProps extends ControllerRenderProps<FieldValues, string> {
	source: GitSourceData;
	deps?: DependencyList;
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
	const [hasError, setHasError] = useState(false);
	const stateRef = useRef<GitRepsModelState>("notLoaded");
	const modelRef = useRef<CloneListItem[]>([]);

	useWatch(() => {
		form.resetField("repository");
	}, [deps]);

	useEffect(() => {
		if (!gitPaginatedProjectList) return;
		setHasError(false);
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
		gitPaginatedProjectList.startLoading().catch(() => setHasError(true));
	}, [gitPaginatedProjectList, repositoryFilter]);

	return (
		<LazySearchSelect
			{...rest}
			disabled={hasError}
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
					return (
						<TextOverflowTooltip className="self-center" data-qa="qa-clickable">
							{option.label}
						</TextOverflowTooltip>
					);
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
