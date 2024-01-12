import Icon from "@components/Atoms/Icon";
import FormStyle from "@components/Form/FormStyle";
import Sidebar from "@components/Layouts/Sidebar";
import ActionListItem from "@components/List/ActionListItem";
import { ButtonItem } from "@components/List/Item";
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
		onCLick: () => setExternalIsOpen(true),
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
							placeholder={`${useLocalize("find")} ${useLocalize("storage2")}`}
							item={
								selectSourceData
									? {
											element: (
												<SourceListItem
													code={selectSourceData.sourceType}
													text={getSourceNameByData(selectSourceData)}
												/>
											),
											labelField: getSourceNameByData(selectSourceData),
									  }
									: ""
							}
							buttons={[addNewStorageListItem]}
							items={[
								...sourceDatas.map((d) => ({
									element: <SourceListItem code={d.sourceType} text={getSourceNameByData(d)} />,
									labelField: getSourceNameByData(d),
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
