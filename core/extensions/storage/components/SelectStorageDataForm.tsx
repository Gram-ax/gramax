import Icon from "@components/Atoms/Icon";
import FormStyle from "@components/Form/FormStyle";
import Sidebar from "@components/Layouts/Sidebar";
import ActionListItem from "@components/List/ActionListItem";
import { ButtonItem } from "@components/List/Item";
import ListLayout from "@components/List/ListLayout";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import GitHubSourceData from "@ext/git/actions/Source/GitHub/logic/GitHubSourceData";
import GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import { useEffect, useState } from "react";
import SelectGitHubStorageDataFields from "../../git/actions/Source/GitHub/components/SelectGitHubStorageDataFields";
import SelectGitLabStorageDataFields from "../../git/actions/Source/GitLab/components/SelectGitLabStorageDataFields";
import useLocalize from "../../localization/useLocalize";
import CreateSourceData from "../logic/SourceDataProvider/components/CreateSourceData";
import SourceData from "../logic/SourceDataProvider/model/SourceData";
import SourceType from "../logic/SourceDataProvider/model/SourceType";
import getStorageNameByData from "../logic/utils/getStorageNameByData";
import StorageData from "../models/StorageData";
import SourceListItem from "./SourceListItem";

interface SelectStorageDataFormProps {
	title: string;
	children?: JSX.Element;
	forClone?: boolean;
	onChange?: (data: StorageData) => void;
}

const SelectStorageDataForm = (props: SelectStorageDataFormProps) => {
	const { title, children, forClone, onChange } = props;
	const pageProps = PageDataContextService.value;
	const [sourceDatas, setStorageDatas] = useState<SourceData[]>(pageProps.sourceDatas);
	const [selectSourceData, setSelectStorageData] = useState<SourceData>(null);

	const [externalIsOpen, setExternalIsOpen] = useState(false);
	const addNewStorageListItem: ButtonItem = {
		element: (
			<CreateSourceData
				externalIsOpen={externalIsOpen}
				trigger={
					<div style={{ width: "100%" }}>
						<ActionListItem>
							<div style={{ width: "100%", padding: "6px 11px" }}>
								<Sidebar
									title={useLocalize("addNewStorage") + "..."}
									leftActions={[<Icon code="plus" viewBox="3 3 18 18" key={0} />]}
								/>
							</div>
						</ActionListItem>
					</div>
				}
				onCreate={(data) => {
					setSelectStorageData(data);
					setStorageDatas([...sourceDatas, data]);
				}}
			/>
		),
		onClick: () => setExternalIsOpen(true),
		labelField: "",
	};

	useEffect(() => {
		if (!selectSourceData) onChange(null);
	}, [selectSourceData]);

	return (
		<FormStyle>
			<>
				<legend>{title}</legend>
				<fieldset>
					<div className="form-group field field-string row">
						<label className="control-label">{useLocalize("storage")}</label>
						<div className="input-lable">
							<ListLayout
								placeholder={`${useLocalize("find")} ${useLocalize("storage2")}`}
								item={
									selectSourceData
										? {
												element: (
													<SourceListItem
														code={selectSourceData.sourceType}
														text={getStorageNameByData(selectSourceData)}
													/>
												),
												labelField: getStorageNameByData(selectSourceData),
										  }
										: ""
								}
								buttons={[addNewStorageListItem]}
								items={[
									...sourceDatas.map((d) => ({
										element: <SourceListItem code={d.sourceType} text={getStorageNameByData(d)} />,
										labelField: getStorageNameByData(d),
									})),
								]}
								onItemClick={(labelField, _, idx) => {
									if (labelField) setSelectStorageData(sourceDatas[idx]);
								}}
								openByDefault={true}
							/>
						</div>
					</div>
					{selectSourceData?.sourceType == SourceType.gitLab && (
						<SelectGitLabStorageDataFields
							source={selectSourceData as GitlabSourceData}
							onChange={onChange}
							forClone={forClone}
						/>
					)}
					{selectSourceData?.sourceType == SourceType.gitHub && (
						<SelectGitHubStorageDataFields
							source={selectSourceData as GitHubSourceData}
							onChange={onChange}
							forClone={forClone}
						/>
					)}
					{children}
				</fieldset>
			</>
		</FormStyle>
	);
};

export default SelectStorageDataForm;
