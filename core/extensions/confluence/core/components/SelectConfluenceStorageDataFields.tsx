import ListLayout from "@components/List/ListLayout";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import ConfluenceAPI from "@ext/confluence/core/api/model/ConfluenceAPI";
import { Space } from "@ext/confluence/core/api/model/ConfluenceAPITypes";
import ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import t from "@ext/localization/locale/translate";
import { useState } from "react";
import debounceFunction from "@core-ui/debounceFunction";
import useWatch from "@core-ui/hooks/useWatch";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const CONFLUENCE_SEARCH_SYMBOL = Symbol();

type SelectProps = {
	source: ConfluenceSourceData;
	onChange?: (data: ConfluenceStorageData) => void;
};

const SelectConfluenceStorageDataFields = ({ source, onChange }: SelectProps) => {
	const [spaces, setSpaces] = useState<Space[]>(null);
	const [isLoadingData, setIsLoadingData] = useState(false);
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;

	const loadSpaces = async (spaceTitle?: string) => {
		setIsLoadingData(true);
		const api = makeSourceApi(source, authServiceUrl) as ConfluenceAPI;

		const spaces: Space[] = await api.getSpaces({
			title: spaceTitle,
			type: "space",
			orderBy: "lastModified",
			sortDirection: "desc",
		});

		setSpaces(spaces);
		setIsLoadingData(false);
	};

	useWatch(() => {
		loadSpaces();
	}, [source]);

	const debouncedSearch = (query: string) => {
		if (source.sourceType === SourceType.confluenceServer) {
			debounceFunction(CONFLUENCE_SEARCH_SYMBOL, () => void loadSpaces(query), 500);
		}
	};

	return (
		<div className="form-group field field-string row">
			<div className="control-label">{t("space")}</div>
			<div className="input-lable">
				<ListLayout
					filterItems={(items) => items}
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
					onSearchChange={(query) => debouncedSearch(query)}
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
