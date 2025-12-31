import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import useIsEnterpriseWorkspace from "@ext/enterprise/utils/useIsEnterpriseWorkspace";
import { getStorageDataByForm } from "@ext/git/actions/Clone/logic/getStorageDataByForm";
import SelectGitStorageDataFields from "@ext/git/actions/Source/Git/components/SelectGitStorageDataFields";
import SelectGiteaStorageDataFields from "@ext/git/actions/Source/Gitea/components/SelectGiteaStorageDataFields";
import GiteaSourceData from "@ext/git/actions/Source/Gitea/logic/GiteaSourceData";
import GitHubSourceData from "@ext/git/actions/Source/GitHub/logic/GitHubSourceData";
import GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import SelectGitVerseStorageDataFields from "@ext/git/actions/Source/GitVerse/components/SelectGitVerseStorageDataFields";
import GitVerseSourceData from "@ext/git/actions/Source/GitVerse/model/GitVerseSourceData.schema";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import GitStorageData from "@ext/git/core/model/GitStorageData";
import t from "@ext/localization/locale/translate";
import CreateStorage from "@ext/storage/components/CreateStorage";
import SourceOption from "@ext/storage/components/SourceOption";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import {
	getSelectStorageFormSchema,
	SelectFormSchemaType,
} from "@ext/storage/logic/SourceDataProvider/model/SelectSourceFormSchema";
import getSourceDataByStorageName from "@ext/storage/logic/utils/getSourceDataByStorageName";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { MenuItem, MenuItemAction } from "@ui-kit/MenuItem";
import { ModalBody } from "@ui-kit/Modal";
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
import { useForm, UseFormReturn } from "react-hook-form";
import SelectGitHubStorageDataFields from "../../git/actions/Source/GitHub/components/SelectGitHubStorageDataFields";
import SelectGitLabStorageDataFields from "../../git/actions/Source/GitLab/components/SelectGitLabStorageDataFields";
import SourceData from "../logic/SourceDataProvider/model/SourceData";
import SourceType from "../logic/SourceDataProvider/model/SourceType";
import getStorageNameByData from "../logic/utils/getStorageNameByData";

interface SelectStorageDataFormProps {
	mode?: "init" | "clone";
	title?: string;
	description?: string;
	selectedStorage?: string;
	onSubmit?: (data: GitStorageData) => Promise<boolean> | boolean | void;
	onClose?: () => void;
}

type GitSourceDatas = GitSourceData | GitlabSourceData | GitHubSourceData | GitVerseSourceData;

const SelectStorageDataForm = (props: SelectStorageDataFormProps) => {
	const { onSubmit, selectedStorage, mode = "clone", onClose, ...formProps } = props;

	const isEnterprise = useIsEnterpriseWorkspace();
	const sourceDatas = SourceDataService.value;
	const apiUrlCreator = ApiUrlCreator.value;

	const filteredSourceDatas = sourceDatas.filter((data) => isGitSourceType(data.sourceType)) as GitSourceDatas[];

	const [isCreateStorageOpen, setIsCreateStorageOpen] = useState(!filteredSourceDatas.length);
	const [invalidSourceData, setInvalidSourceData] = useState<SourceData>(null);
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<SelectFormSchemaType>({
		resolver: zodResolver(getSelectStorageFormSchema(mode)),
		defaultValues: {
			sourceKey: selectedStorage,
		},
		mode: "onChange",
	});

	const { watch } = form;
	const sourceKey = watch("sourceKey");
	const sourceData: GitSourceDatas = useMemo(
		() =>
			sourceKey && sourceKey !== "add-new-storage"
				? (getSourceDataByStorageName(sourceKey, sourceDatas) as GitSourceDatas)
				: null,
		[sourceKey, sourceDatas],
	);

	const formSubmit = (e) => {
		form.handleSubmit(async (data) => {
			setIsLoading(true);
			const storageData = getStorageDataByForm(sourceData, data);
			await onSubmit?.(storageData as GitStorageData);
			setIsLoading(false);
		})(e);
	};

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
		[sourceDatas, form, apiUrlCreator],
	);

	const onSourceClickEdit = (sourceData: GitSourceData | GitlabSourceData | GitHubSourceData) => {
		setInvalidSourceData({
			domain: sourceData.domain,
			token: sourceData.token,
			sourceType: sourceData.sourceType,
			userName: sourceData.userName,
			userEmail: sourceData.userEmail,
			isInvalid: sourceData?.token && sourceData.isInvalid,
		} as any);
		setIsCreateStorageOpen(true);
	};

	const getFormLowerPart = (form: UseFormReturn<SelectFormSchemaType>, sourceData: SourceData) => {
		return (
			<>
				{sourceData?.sourceType === SourceType.git && (
					<SelectGitStorageDataFields mode={mode} form={form} source={sourceData as GitSourceData} />
				)}
				{sourceData?.sourceType === SourceType.gitLab && (
					<SelectGitLabStorageDataFields mode={mode} form={form} source={sourceData as GitlabSourceData} />
				)}
				{sourceData?.sourceType === SourceType.gitHub && (
					<SelectGitHubStorageDataFields mode={mode} form={form} source={sourceData as GitHubSourceData} />
				)}
				{sourceData?.sourceType === SourceType.gitVerse && (
					<SelectGitVerseStorageDataFields
						mode={mode}
						form={form}
						source={sourceData as GitVerseSourceData}
					/>
				)}
				{sourceData?.sourceType === SourceType.gitea && (
					<SelectGiteaStorageDataFields mode={mode} form={form} source={sourceData as GiteaSourceData} />
				)}
			</>
		);
	};

	return (
		<>
			<Form asChild {...form}>
				<form className="contents ui-kit" onSubmit={formSubmit}>
					<FormHeader
						title={formProps.title ?? t("forms.clone-repo.name")}
						description={formProps.description ?? t("forms.clone-repo.description")}
						icon="git-pull-request"
					/>
					<ModalBody>
						<FormStack>
							<FormField
								title={t("forms.clone-repo.props.storage.name")}
								name="sourceKey"
								control={({ field }) => (
									<Select {...field} onValueChange={(val) => val && field.onChange(val)}>
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
															storageKey={storageKey}
															source={d}
															onEdit={
																isEnterprise
																	? undefined
																	: () => {
																			onSourceClickEdit(d);
																	  }
															}
															onDelete={
																isEnterprise
																	? undefined
																	: () => {
																			if (sourceKey === storageKey) form.reset();
																	  }
															}
															onInvalid={() => {
																onSourceClickEdit(d);
															}}
														/>
													);
												})}
											</SelectGroup>
											{!isEnterprise && filteredSourceDatas.length > 0 && <SelectSeparator />}
											{!isEnterprise && (
												<SelectOption
													value="add-new-storage"
													asChild
													role="button"
													onPointerDown={() => setIsCreateStorageOpen(true)}
												>
													<MenuItem>
														<MenuItemAction icon="plus" text={t("add-storage")} />
													</MenuItem>
												</SelectOption>
											)}
										</SelectContent>
									</Select>
								)}
							/>
							{sourceKey && getFormLowerPart(form, sourceData)}
						</FormStack>
					</ModalBody>
					<FormFooter
						primaryButton={
							<Button disabled={isLoading}>
								{isLoading && <SpinnerLoader width={16} height={16} />}
								{(!isLoading && (mode === "init" ? t("add") : t("load"))) ||
									(isLoading && t("loading"))}
							</Button>
						}
					/>
				</form>
			</Form>
			{isCreateStorageOpen && (
				<CreateStorage
					isOpen={isCreateStorageOpen}
					setIsOpen={setIsCreateStorageOpen}
					onSubmit={onSourceDataCreate}
					onClose={() => {
						setInvalidSourceData(null);
						onClose?.();
					}}
					title={invalidSourceData ? t("forms.add-storage.name3") : t("forms.add-storage.name2")}
					data={invalidSourceData}
					sourceType={invalidSourceData?.sourceType}
					isReadonly={invalidSourceData?.isInvalid}
				/>
			)}
		</>
	);
};

export default SelectStorageDataForm;
