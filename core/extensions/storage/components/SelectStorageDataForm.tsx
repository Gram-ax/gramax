import Icon from "@components/Atoms/Icon";
import FormStyle from "@components/Form/FormStyle";
import Sidebar from "@components/Layouts/Sidebar";
import ActionListItem from "@components/List/ActionListItem";
import { ListItem } from "@components/List/Item";
import ListLayout from "@components/List/ListLayout";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useEffect, useState } from "react";
import SelectGitHubStorageDataFields from "../../git/actions/Storage/GitHub/components/SelectGitHubStorageDataFields";
import SelectGitLabStorageDataFields from "../../git/actions/Storage/GitLab/components/SelectGitLabStorageDataFields";
import GitSourceData from "../../git/core/model/GitSourceData.schema";
import useLocalize from "../../localization/useLocalize";
import CreateSourceData from "../logic/SourceDataProvider/components/CreateSourceData";
import SourceData from "../logic/SourceDataProvider/model/SourceData";
import SourceType from "../logic/SourceDataProvider/model/SourceType";
import getSourceNameByData from "../logic/utils/getSourceNameByData";
import StorageData from "../models/StorageData";
import SourceListItem from "./SourceListItem";

const SelectStorageDataForm = ({
	title,
	children,
	forClone,
	onChange,
}: {
	title: string;
	children?: JSX.Element;
	forClone?: boolean;
	onChange?: (data: StorageData) => void;
}) => {
	const pageProps = PageDataContextService.value;
	const [sourceDatas, setStorageDatas] = useState<SourceData[]>(pageProps.sourceDatas);
	const [selectSourceData, setSelectStorageData] = useState<SourceData>(null);

	const addNewStorageListItem: ListItem = {
		element: (
			<CreateSourceData
				trigger={
					<div style={{ width: "100%" }}>
						<ActionListItem>
							<div style={{ width: "100%", padding: "5px 10px" }}>
								<Sidebar
									title={useLocalize("addNewStorage") + "..."}
									leftActions={[<Icon code={"plus"} key={0} />]}
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
		labelField: "",
	};

	useEffect(() => {
		if (!selectSourceData) onChange(null);
	}, [selectSourceData]);

	return (
		<FormStyle>
			<>
				<legend>{title}</legend>
				<div className="form-group field field-string row">
					<label className="control-label">{useLocalize("storage")}</label>
					<div className="input-lable">
						<ListLayout
							openByDefault={true}
							placeholder={`${useLocalize("find")} ${useLocalize("storage2")}`}
							item={
								!selectSourceData
									? ""
									: {
											element: (
												<SourceListItem
													code={selectSourceData.sourceType}
													text={getSourceNameByData(selectSourceData)}
												/>
											),
											labelField: getSourceNameByData(selectSourceData),
									  }
							}
							items={[
								addNewStorageListItem,
								...sourceDatas.map((d) => ({
									element: <SourceListItem code={d.sourceType} text={getSourceNameByData(d)} />,
									labelField: getSourceNameByData(d),
								})),
							]}
							onItemClick={(labelField, _, idx) => {
								if (labelField) setSelectStorageData(sourceDatas[idx - 1]);
							}}
							onSearchClick={() => setSelectStorageData(null)}
						/>
					</div>
				</div>
				{selectSourceData?.sourceType == SourceType.gitLab && (
					<SelectGitLabStorageDataFields
						source={selectSourceData as GitSourceData}
						onChange={onChange}
						forClone={forClone}
					/>
				)}
				{selectSourceData?.sourceType == SourceType.gitHub && (
					<SelectGitHubStorageDataFields
						source={selectSourceData as GitSourceData}
						onChange={onChange}
						forClone={forClone}
					/>
				)}

				{children}
			</>
		</FormStyle>
	);
};

export default SelectStorageDataForm;
