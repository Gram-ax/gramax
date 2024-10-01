import ListLayout from "@components/List/ListLayout";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import ConfluenceAPI from "@ext/confluence/core/api/model/ConfluenceAPI";
import { Space } from "@ext/confluence/core/api/model/ConfluenceAPITypes";
import ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import t from "@ext/localization/locale/translate";
import { useEffect, useState } from "react";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

type SelectProps = {
	source: ConfluenceSourceData;
	onChange?: (data: ConfluenceStorageData) => void;
};

const SelectConfluenceStorageDataFields = ({ source, onChange }: SelectProps) => {
	const [spaces, setSpaces] = useState<Space[]>(null);
	const [isLoadingData, setIsLoadingData] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;

	const loadSpaces = async () => {
		setIsLoadingData(true);
		const api = makeSourceApi(source, authServiceUrl) as ConfluenceAPI;

		let spaces: Space[] = await api.getSpaces();
		if (!spaces.length && source.sourceType === SourceType.confluenceCloud) {
			await api.removeExpiredCredentials(apiUrlCreator);
			spaces = await api.getSpaces();
		}

		setSpaces(spaces);
		setIsLoadingData(false);
	};

	useEffect(() => {
		void loadSpaces();
	}, [source]);

	return (
		<div className="form-group field field-string row">
			<div className="control-label">{t("space")}</div>
			<div className="input-lable">
				<ListLayout
					isLoadingData={isLoadingData}
					openByDefault={true}
					items={spaces?.map((space) => ({
						element: (
							<div style={{ width: "100%", padding: "6px 12px" }}>
								<p>{space.name}</p>
							</div>
						),
						labelField: space.name,
					}))}
					onItemClick={(_, __, idx) => {
						onChange({
							displayName: spaces[idx].name,
							name: transliterate(spaces[idx].name, { kebab: true, maxLength: 50 }),
							id: spaces[idx].id,
							source,
						});
					}}
				/>
			</div>
		</div>
	);
};

export default SelectConfluenceStorageDataFields;
