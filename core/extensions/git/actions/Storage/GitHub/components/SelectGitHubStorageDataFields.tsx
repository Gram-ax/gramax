import Icon from "@components/Atoms/Icon";
import Sidebar from "@components/Layouts/Sidebar";
import ActionListItem from "@components/List/ActionListItem";
import ListLayout from "@components/List/ListLayout";
import LoadingListItem from "@components/List/LoadingListItem";
import { useEffect, useState } from "react";
import parseStorageUrl from "../../../../../../logic/utils/parseStorageUrl";
import createChildWindow from "../../../../../../ui-logic/ChildWindow/createChildWindow";
import GitSourceData from "../../../../core/model/GitSourceData.schema";
import GitStorageData from "../../../../core/model/GitStorageData";
import CloneFields from "../../components/CloneFields";
import GitHubApi from "../logic/GitHubApi";
import GitHubUser from "./GitHubUser";

const SelectGitHubStorageDataFields = ({
	source,
	forClone,
	onChange,
}: {
	source: GitSourceData;
	forClone?: boolean;
	onChange?: (data: GitStorageData) => void;
}) => {
	const [group, setGroup] = useState<string>(null);
	const [installation, setInstallation] = useState(null);
	const [installations, setInstallations] = useState(null);

	const loadInstallations = async () => {
		if (!source?.token) return;
		const gitHubApi = new GitHubApi(source.token);
		setInstallations(await gitHubApi.getInstallations());
	};

	useEffect(() => {
		loadInstallations();
	}, [source]);

	useEffect(() => {
		if (!installation?.htmlUrl) return setGroup(null);
		setGroup(parseStorageUrl(installation.htmlUrl).name);
	}, [installation]);

	useEffect(() => {
		if (!group) return;
		onChange({ name: null, group, source });
	}, [group]);

	return (
		<>
			<div className="form-group field field-string row">
				<div className="control-label">Аккаунт</div>
				<div className="input-lable">
					<ListLayout
						openByDefault={true}
						items={[
							{
								element: (
									<div
										style={{ width: "100%" }}
										onClick={() =>
											createChildWindow(
												"https://github.com/apps/gram-ax/installations/select_target",
												700,
												550,
												"https://github.com/login/device/success",
												() => {
													setInstallations(null);
													loadInstallations();
												},
											)
										}
									>
										<ActionListItem>
											<div style={{ width: "100%", padding: "5px 10px" }}>
												<Sidebar
													title={"Добавить аккаунт..."}
													leftActions={[<Icon code={"plus"} key={0} />]}
												/>
											</div>
										</ActionListItem>
									</div>
								),
								labelField: "",
							},
							...(installations
								? installations.map((installation) => ({
										element: (
											<div style={{ width: "100%", padding: "5px 10px" }}>
												<GitHubUser {...installation} />
											</div>
										),
										labelField: installation.name,
								  }))
								: [LoadingListItem]),
						]}
						onItemClick={(labelField, _, idx) => {
							if (!labelField) return;
							setInstallation(installations[idx - 1]);
						}}
						onSearchClick={() => setInstallation(null)}
					/>
				</div>
			</div>
			{forClone && group && (
				<CloneFields
					onChange={onChange}
					source={source}
					getLoadProjects={async (source) => {
						if (!source) return;
						const gitHubApi = new GitHubApi(source.token);
						const project = await gitHubApi.getAllProjects();
						return project.filter((p) => p.split("/")[0] == group);
					}}
				/>
			)}
		</>
	);
};

export default SelectGitHubStorageDataFields;
