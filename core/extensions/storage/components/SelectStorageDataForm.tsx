import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import useIsEnterpriseWorkspace from "@ext/enterprise/utils/useIsEnterpriseWorkspace";
import { getStorageDataByForm } from "@ext/git/actions/Clone/logic/getStorageDataByForm";
import SelectGitStorageDataFields from "@ext/git/actions/Source/Git/components/SelectGitStorageDataFields";
import SelectGiteaStorageDataFields from "@ext/git/actions/Source/Gitea/components/SelectGiteaStorageDataFields";
import type GiteaSourceData from "@ext/git/actions/Source/Gitea/logic/GiteaSourceData";
import type GitHubSourceData from "@ext/git/actions/Source/GitHub/logic/GitHubSourceData";
import type GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import SelectGitVerseStorageDataFields from "@ext/git/actions/Source/GitVerse/components/SelectGitVerseStorageDataFields";
import type GitVerseSourceData from "@ext/git/actions/Source/GitVerse/model/GitVerseSourceData.schema";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import type GitStorageData from "@ext/git/core/model/GitStorageData";
import t from "@ext/localization/locale/translate";
import CreateStorage from "@ext/storage/components/CreateStorage";
import SourceOption from "@ext/storage/components/SourceOption";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import {
	getSelectStorageFormSchema,
	type SelectFormSchemaType,
} from "@ext/storage/logic/SourceDataProvider/model/SelectSourceFormSchema";
import getSourceDataByStorageName from "@ext/storage/logic/utils/getSourceDataByStorageName";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { DialogBody } from "@ui-kit/Dialog";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { MenuItem, MenuItemAction } from "@ui-kit/MenuItem";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectOption,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@ui-kit/Select";
import { useCallback, useMemo, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import SelectGitHubStorageDataFields from "../../git/actions/Source/GitHub/components/SelectGitHubStorageDataFields";
import SelectGitLabStorageDataFields from "../../git/actions/Source/GitLab/components/SelectGitLabStorageDataFields";
import type SourceData from "../logic/SourceDataProvider/model/SourceData";
import SourceType from "../logic/SourceDataProvider/model/SourceType";
import getStorageNameByData from "../logic/utils/getStorageNameByData";

interface SelectStorageDataFormProps {
	mode?: "init" | "clone";
	title?: string;
	description?: string;
	selectedStorage?: string;
	onSubmit?: (data: GitStorageData) => Promise<boolean> | boolean | unknown;
	onClose?: () => void;
}

type GitSourceDatas = GitSourceData | GitlabSourceData | GitHubSourceData | GitVerseSourceData | GiteaSourceData;

export type SelectStorageDataFormData = SelectFormSchemaType;

const useEnterpriseSourceData = (filteredSourceDatas: GitSourceDatas[]) => {
	const isEnterprise = useIsEnterpriseWorkspace();
	const gesUrl = PageDataContextService.value.conf.enterprise.gesUrl;

	const enterpriseSourceData = useMemo(
		() => (isEnterprise ? getEnterpriseSourceData(filteredSourceDatas, gesUrl) : null),
		[filteredSourceDatas, gesUrl, isEnterprise],
	);

	const enterpriseSourceKey = useMemo(
		() => (enterpriseSourceData ? getStorageNameByData(enterpriseSourceData) : undefined),
		[enterpriseSourceData],
	);
	const shouldDisableStorageSelect = isEnterprise && !!enterpriseSourceKey;

	return {
		isEnterprise,
		enterpriseSourceKey,
		shouldDisableStorageSelect,
	};
};

const SelectStorageDataForm = (props: SelectStorageDataFormProps) => {
	const { onSubmit, selectedStorage, mode = "clone", onClose, ...formProps } = props;

	const sourceDatas = SourceDataService.value;
	const apiUrlCreator = ApiUrlCreator.value;

	const filteredSourceDatas = sourceDatas.filter((data) => isGitSourceType(data.sourceType)) as GitSourceDatas[];
	const { isEnterprise, enterpriseSourceKey, shouldDisableStorageSelect } =
		useEnterpriseSourceData(filteredSourceDatas);

	const formDescription =
		formProps.description ??
		(shouldDisableStorageSelect ? t("forms.clone-repo.enterprise-description") : t("forms.clone-repo.description"));

	const [isCreateStorageOpen, setIsCreateStorageOpen] = useState(!filteredSourceDatas.length);
	const [invalidSourceData, setInvalidSourceData] = useState<GitSourceDatas>(null);
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<SelectFormSchemaType>({
		resolver: zodResolver(getSelectStorageFormSchema(mode)),
		defaultValues: {
			sourceKey: selectedStorage ?? enterpriseSourceKey,
		},
		mode: "onChange",
	});

	const { watch } = form;
	const sourceKey = watch("sourceKey");
	const sourceData: GitSourceDatas = useMemo(
		() =>
			sourceKey && sourceKey !== "add-new-storage"
				? (getSourceDataByStorageName(sourceKey, filteredSourceDatas) as GitSourceDatas)
				: null,
		[sourceKey, filteredSourceDatas],
	);

	const formSubmit = (e) => {
		form.handleSubmit(async (data) => {
			setIsLoading(true);
			const storageData = getStorageDataByForm(sourceData, data);
			await onSubmit?.(storageData as GitStorageData);
			setIsLoading(false);
		})(e);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: update list of newSourceDatas
	const onSourceDataCreate = useCallback(
		async (data: SourceData) => {
			const url = apiUrlCreator.setSourceData();
			const res = await FetchService.fetch(url, JSON.stringify(data), MimeTypes.json);
			if (!res.ok) return;

			const storageKey = getStorageNameByData(data);
			const newSourceDatas = [...sourceDatas.filter((d) => getStorageNameByData(d) !== storageKey), data];
			SourceDataService.value = newSourceDatas;

			if (!data.isInvalid) form.setValue("sourceKey", storageKey);
		},
		[sourceDatas, form],
	);

	const onSourceClickEdit = (sourceData: GitSourceDatas) => {
		setInvalidSourceData({
			domain: sourceData.domain,
			token: sourceData.token,
			sourceType: sourceData.sourceType,
			userName: sourceData.userName,
			userEmail: sourceData.userEmail,
			isInvalid: sourceData?.token && sourceData.isInvalid,
		});
		setIsCreateStorageOpen(true);
	};

	const getFormLowerPart = (form: UseFormReturn<SelectFormSchemaType>, sourceData: SourceData) => {
		return (
			<>
				{sourceData?.sourceType === SourceType.git && (
					<SelectGitStorageDataFields form={form} mode={mode} source={sourceData as GitSourceData} />
				)}
				{sourceData?.sourceType === SourceType.gitLab && (
					<SelectGitLabStorageDataFields form={form} mode={mode} source={sourceData as GitlabSourceData} />
				)}
				{sourceData?.sourceType === SourceType.gitHub && (
					<SelectGitHubStorageDataFields form={form} mode={mode} source={sourceData as GitHubSourceData} />
				)}
				{sourceData?.sourceType === SourceType.gitVerse && (
					<SelectGitVerseStorageDataFields
						form={form}
						mode={mode}
						source={sourceData as GitVerseSourceData}
					/>
				)}
				{sourceData?.sourceType === SourceType.gitea && (
					<SelectGiteaStorageDataFields form={form} mode={mode} source={sourceData as GiteaSourceData} />
				)}
			</>
		);
	};

	return (
		<>
			<Form asChild {...form}>
				<form className="contents ui-kit" onSubmit={formSubmit}>
					<FormHeader
						description={formDescription}
						icon="git-pull-request"
						title={formProps.title ?? t("forms.clone-repo.name")}
					/>
					<DialogBody>
						<FormStack>
							<FormField
								control={({ field }) => (
									<Select
										{...field}
										disabled={shouldDisableStorageSelect}
										onValueChange={(val) => val && field.onChange(val)}
									>
										<SelectTrigger>
											<SelectValue
												placeholder={t("forms.clone-repo.props.storage.placeholder")}
											/>
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{filteredSourceDatas.map((d) => {
													const storageKey = getStorageNameByData(d);
													return (
														<SourceOption
															key={storageKey}
															onDelete={
																isEnterprise
																	? undefined
																	: () => {
																			if (sourceKey === storageKey) form.reset();
																		}
															}
															onEdit={
																isEnterprise
																	? undefined
																	: () => {
																			onSourceClickEdit(d);
																		}
															}
															onInvalid={() => {
																onSourceClickEdit(d);
															}}
															source={d}
															storageKey={storageKey}
														/>
													);
												})}
											</SelectGroup>
											{!isEnterprise && filteredSourceDatas.length > 0 && <SelectSeparator />}
											{!isEnterprise && (
												<SelectOption
													asChild
													onPointerDown={() => setIsCreateStorageOpen(true)}
													role="button"
													value="add-new-storage"
												>
													<MenuItem>
														<MenuItemAction icon="plus" text={t("add-storage")} />
													</MenuItem>
												</SelectOption>
											)}
										</SelectContent>
									</Select>
								)}
								name="sourceKey"
								title={t("forms.clone-repo.props.storage.name")}
							/>
							{sourceKey && getFormLowerPart(form, sourceData)}
						</FormStack>
					</DialogBody>
					<FormFooter
						primaryButton={
							<Button disabled={isLoading}>
								{isLoading && <SpinnerLoader height={16} width={16} />}
								{(!isLoading && (mode === "init" ? t("add") : t("load"))) ||
									(isLoading && t("loading"))}
							</Button>
						}
					/>
				</form>
			</Form>
			{isCreateStorageOpen && (
				<CreateStorage
					data={invalidSourceData}
					isOpen={isCreateStorageOpen}
					isReadonly={invalidSourceData?.isInvalid}
					onClose={() => {
						setInvalidSourceData(null);
						onClose?.();
					}}
					onSubmit={onSourceDataCreate}
					setIsOpen={setIsCreateStorageOpen}
					sourceType={invalidSourceData?.sourceType}
					title={invalidSourceData ? t("forms.add-storage.name3") : t("forms.add-storage.name2")}
				/>
			)}
		</>
	);
};

export default SelectStorageDataForm;
