import { ItemContent, ListItem } from "@components/List/Item";
import ListLayout, { ListLayoutElement } from "@components/List/ListLayout";
import { getHttpsRepositoryUrl } from "@components/libs/utils";
import GitDateSideBar from "@ext/git/actions/Branch/components/GitDateSideBar";
import GitPaginatedProjectList from "@ext/git/actions/Source/Git/logic/GitPaginatedProjectList";
import GitRepsModelState from "@ext/git/actions/Source/Git/model/GitRepsModelState";
import t from "@ext/localization/locale/translate";
import { useEffect, useRef, useState } from "react";
import parseStorageUrl from "../../../../../logic/utils/parseStorageUrl";
import GitSourceData from "../../../core/model/GitSourceData.schema";
import GitStorageData from "../../../core/model/GitStorageData";

interface CloneFieldsProps {
	source: GitSourceData;
	onChange: (data: GitStorageData) => void;
	gitPaginatedProjectList: GitPaginatedProjectList;
}

export interface CloneListItem {
	path: string;
	date: number;
}

const CloneFields = (props: CloneFieldsProps) => {
	const { source, onChange, gitPaginatedProjectList } = props;

	const [searchValue, setSearchValue] = useState("");
	const [modelState, setModelState] = useState<GitRepsModelState>("notLoaded");
	const [listItems, setListItems] = useState<ItemContent[]>([]);

	const ref = useRef<ListLayoutElement>(null);

	const showLoading = ((): boolean => {
		switch (modelState) {
			case "notLoaded":
				return false;
			case "loading": {
				if (!listItems.length) return true;
				return !!searchValue;
			}
			case "done":
				return false;
		}
	})();

	const setProjectWrapper = (value: string) => {
		const urlWithDomain = source.domain + "/" + value;
		const { group, name } = parseStorageUrl(urlWithDomain);
		if (onChange) onChange({ source, group, name });
	};

	useEffect(() => {
		if (!gitPaginatedProjectList) return;
		ref.current?.searchRef.inputRef.focus();
		gitPaginatedProjectList.onPagesFetched((model, state) => {
			setModelState(state);
			const newListItems = model.map((m): ListItem => {
				if (!m) return { element: null, loading: true };
				return {
					element: (
						<GitDateSideBar
							title={m.path}
							data={{ lastCommitModify: m.date.toString() }}
							dateWidth="wide"
						/>
					),
					labelField: m.path,
				};
			});
			setListItems(newListItems);
		});
		void gitPaginatedProjectList.startLoading();
	}, [gitPaginatedProjectList]);

	return (
		<div className="form-group field field-string row">
			<label className="control-label">{t("repository")}</label>
			<div className="input-lable">
				<ListLayout
					isLoadingData={showLoading}
					ref={ref}
					openByDefault={true}
					placeholder={`${t("find")} ${t("repository2")}`}
					item={""}
					items={showLoading ? [] : listItems}
					onItemClick={setProjectWrapper}
					onSearchChange={(v) => {
						setSearchValue(v);
						const url = getHttpsRepositoryUrl(v);
						const parsedStorageUrl = parseStorageUrl(url);
						if (parsedStorageUrl.domain !== source.domain) return;
						if (!parsedStorageUrl.group || !parsedStorageUrl.name) return setProjectWrapper(null);
						setProjectWrapper(`${parsedStorageUrl.group}/${parsedStorageUrl.name} `);
					}}
				/>
			</div>
		</div>
	);
};

export default CloneFields;
