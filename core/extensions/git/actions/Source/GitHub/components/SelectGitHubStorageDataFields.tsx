import ListLayout from "@components/List/ListLayout";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import GitPaginatedProjectList from "@ext/git/actions/Source/Git/logic/GitPaginatedProjectList";
import GitHubSourceData from "@ext/git/actions/Source/GitHub/logic/GitHubSourceData";
import GithubStorageData from "@ext/git/actions/Source/GitHub/model/GithubStorageData";
import GitSourceApi from "@ext/git/actions/Source/GitSourceApi";
import t from "@ext/localization/locale/translate";
import User2 from "@ext/security/components/User/User2";
import { useEffect, useMemo, useState } from "react";
import parseStorageUrl from "../../../../../../logic/utils/parseStorageUrl";
import createChildWindow from "../../../../../../ui-logic/ChildWindow/createChildWindow";
import CloneFields from "../../components/CloneFields";
import { makeSourceApi } from "../../makeSourceApi";
import GithubSourceAPI from "../logic/GithubSourceAPI";
import Mode from "@ext/git/actions/Clone/model/Mode";

type SelectProps = {
	source: GitHubSourceData;
	mode?: Mode;
	onChange?: (data: GithubStorageData) => void;
};

const SelectGitHubStorageDataFields = ({ source, mode, onChange }: SelectProps) => {
	const { authServiceUrl, isRelease } = PageDataContextService.value.conf;
	const [installation, setInstallation] = useState(null);
	const [installations, setInstallations] = useState(null);
	const [isLoadingData, setIsLoadingData] = useState(false);

	const type = installation?.type;
	const group = installation?.htmlUrl ? parseStorageUrl(installation.htmlUrl).name : null;

	const gitPaginatedProjectList = useMemo(
		() =>
			group &&
			new GitPaginatedProjectList(
				makeSourceApi(source, authServiceUrl) as GitSourceApi,
				(modelItem) => modelItem.path.split("/")[0] === group,
			),
		[source, authServiceUrl, group],
	);

	const loadInstallations = async () => {
		if (!source?.token) return;
		setIsLoadingData(true);
		const gitHubApi = new GithubSourceAPI(source, authServiceUrl);
		setInstallations(await gitHubApi.getInstallations());
		setIsLoadingData(false);
	};

	useEffect(() => {
		void loadInstallations();
	}, [source]);

	useEffect(() => {
		if (!group || !type) return;
		onChange({ name: null, group, source, type });
	}, [group, type]);

	return (
		<>
			<div className="form-group field field-string row">
				<div className="control-label">{t("account")}</div>
				<div className="input-lable">
					<ListLayout
						isLoadingData={isLoadingData}
						openByDefault={true}
						buttons={[
							{
								element: `${t("add-account")}...`,
								icon: "plus",
								iconViewBox: "3 3 18 18",
								labelField: "",
								onClick: () => {
									void createChildWindow(
										isRelease
											? "https://github.com/apps/gram-ax/installations/select_target"
											: "https://github.com/apps/gramax-dev/installations/select_target",
										700,
										550,
										"https://github.com/login/device/success",
										() => {
											setInstallations(null);
											void loadInstallations();
										},
									);
								},
							},
						]}
						items={installations?.map((installation) => ({
							element: (
								<div style={{ width: "100%", padding: "6px 12px" }}>
									<User2 {...installation} />
								</div>
							),
							labelField: installation.name,
						}))}
						onItemClick={(_, __, idx) => {
							setInstallation(installations[idx]);
						}}
						onSearchClick={() => setInstallation(null)}
					/>
				</div>
			</div>
			{mode === Mode.clone && group && (
				<CloneFields onChange={onChange} source={source} gitPaginatedProjectList={gitPaginatedProjectList} />
			)}
		</>
	);
};

export default SelectGitHubStorageDataFields;
