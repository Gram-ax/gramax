import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import GitPaginatedProjectList from "@ext/git/actions/Source/Git/logic/GitPaginatedProjectList";
import GitHubSourceData from "@ext/git/actions/Source/GitHub/logic/GitHubSourceData";
import t from "@ext/localization/locale/translate";
import User2 from "@ext/security/components/User/User2";
import { useMemo, useRef, useState } from "react";
import parseStorageUrl from "../../../../../../logic/utils/parseStorageUrl";
import CloneFields from "../../components/CloneFields";
import { useMakeSourceApi } from "../../makeSourceApi";
import GithubSourceAPI from "../logic/GithubSourceAPI";
import { FormField } from "@ui-kit/Form";
import { UseFormReturn } from "react-hook-form";
import { SelectFormSchemaType } from "@ext/storage/logic/SourceDataProvider/model/SelectSourceFormSchema";
import {
	Select,
	SelectContent,
	SelectTrigger,
	SelectValue,
	SelectSeparator,
	SelectGroup,
	SelectOption,
	SelectItem,
} from "@ui-kit/Select";
import { MenuItem, MenuItemAction } from "@ui-kit/MenuItem";
import createChildWindow from "@core-ui/ChildWindow/createChildWindow";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";

type SelectOptionType = {
	label: string;
	value: string;
	avatarUrl: string;
};

type SelectProps = {
	mode?: "init" | "clone";
	form: UseFormReturn<SelectFormSchemaType>;
	source: GitHubSourceData;
};

const CustomSelectOption = ({ label, avatarUrl }: { label: string; avatarUrl: string }) => {
	return (
		<div className="flex flex-row items-center justify-between w-full">
			<User2 avatarUrl={avatarUrl} name={label} />
		</div>
	);
};

const SelectGitHubStorageDataFields = ({ form, source, mode }: SelectProps) => {
	const { authServiceUrl, isRelease } = PageDataContextService.value.conf;

	const sourceApi = useMakeSourceApi(source, authServiceUrl) as GithubSourceAPI;
	const [options, setOptions] = useState<SelectOptionType[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const isLoaded = useRef(false);

	const { watch } = form;
	const user = watch("user");
	const group = user?.htmlUrl ? parseStorageUrl(user.htmlUrl).name : null;

	const gitPaginatedProjectList = useMemo(
		() =>
			group &&
			new GitPaginatedProjectList(sourceApi, (modelItem) => {
				if (modelItem === null) return true;
				return modelItem && modelItem.path.split("/")[0] === group;
			}),
		[sourceApi, group],
	);

	const loadInstallations = () => {
		setIsLoading(true);
		sourceApi.getInstallations().then((installations) => {
			setOptions(
				installations.map((installation) => ({
					value: installation.name,
					label: installation.name,
					...installation,
				})),
			);
			setIsLoading(false);
		});
	};

	const authorizeNewAccount = () => {
		void createChildWindow(
			isRelease
				? "https://github.com/apps/gram-ax/installations/select_target"
				: "https://github.com/apps/gramax-dev/installations/select_target",
			700,
			550,
			"https://github.com/login/device/success",
			() => {
				void loadInstallations();
			},
		);
	};

	const onSelectUser = (value: string) => {
		const user = options.find((option) => option.value === value);
		if (user) form.setValue("user", user, { shouldValidate: true, shouldDirty: true });
	};

	const deps = useMemo(() => [user?.name], [user?.name]);

	const onOpenChange = (open: boolean) => {
		if (open && !isLoaded.current) {
			void loadInstallations();
			isLoaded.current = true;
		}
	};

	return (
		<>
			<FormField
				title={t("account")}
				name="user"
				control={({ field }) => (
					<Select
						{...field}
						value={field?.value?.value || undefined}
						onValueChange={(val) => val && onSelectUser(val)}
						onOpenChange={onOpenChange}
					>
						<SelectTrigger>
							<SelectValue placeholder={t("forms.clone-repo.props.storage.placeholder")} />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{isLoading && (
									<SelectItem value="loading" disabled>
										<span className="flex flex-row items-center gap-1.5">
											<SpinnerLoader width={16} height={16} />
											{t("loading")}
										</span>
									</SelectItem>
								)}
								{!isLoading &&
									options.map((d) => {
										const account = d.value;
										return (
											<SelectItem key={account} value={account}>
												<CustomSelectOption label={account} avatarUrl={d.avatarUrl} />
											</SelectItem>
										);
									})}
							</SelectGroup>
							{(isLoading || options.length > 0) && <SelectSeparator />}
							<SelectOption
								value="add-new-account"
								asChild
								role="button"
								onPointerDown={() => authorizeNewAccount()}
							>
								<MenuItem>
									<MenuItemAction icon="plus" text={t("add-account")} />
								</MenuItem>
							</SelectOption>
						</SelectContent>
					</Select>
				)}
			/>
			{user?.name && mode === "clone" && (
				<FormField
					title={t("repository")}
					name="repository"
					control={({ field }) => (
						<CloneFields
							{...field}
							form={form}
							deps={deps}
							repositoryFilter={(repository) => repository.path.startsWith(user?.name)}
							source={source}
							gitPaginatedProjectList={gitPaginatedProjectList}
						/>
					)}
				/>
			)}
		</>
	);
};

export default SelectGitHubStorageDataFields;
