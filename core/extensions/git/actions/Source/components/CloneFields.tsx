import ListLayout, { ListLayoutElement } from "@components/List/ListLayout";
import { getHttpsRepositoryUrl } from "@components/libs/utils";
import t from "@ext/localization/locale/translate";
import { useEffect, useRef, useState } from "react";
import parseStorageUrl from "../../../../../logic/utils/parseStorageUrl";
import GitSourceData from "../../../core/model/GitSourceData.schema";
import GitStorageData from "../../../core/model/GitStorageData";

interface CloneFieldsProps {
	source: GitSourceData;
	onChange: (data: GitStorageData) => void;
	getLoadProjects: (source: GitSourceData) => Promise<string[]>;
}

const CloneFields = (props: CloneFieldsProps) => {
	const { source, onChange, getLoadProjects } = props;
	const [project, setProject] = useState<string>(null);
	const [projects, setProjects] = useState<string[]>([]);
	const [hasLoaded, setHasLoaded] = useState(false);
	const ref = useRef<ListLayoutElement>(null);
	const [isLoadingData, setIsLoadingData] = useState(false);

	const loadProjects = async (source: GitSourceData) => {
		setIsLoadingData(true);
		setProjects(await getLoadProjects(source));
		setIsLoadingData(false);
		setHasLoaded(true);
	};

	useEffect(() => {
		if (hasLoaded) ref.current.searchRef.inputRef.focus();
	}, [hasLoaded]);

	useEffect(() => {
		void loadProjects(source);
	}, [source]);

	useEffect(() => {
		const [group, name] = project ? project.split("/") : [null, null];
		if (onChange) onChange({ source, group, name });
	}, [project]);

	return (
		<div className="form-group field field-string row">
			<label className="control-label">{t("repository")}</label>
			<div className="input-lable">
				<ListLayout
					isLoadingData={isLoadingData}
					ref={ref}
					openByDefault={true}
					placeholder={`${t("find")} ${t("repository2")}`}
					item={project ?? ""}
					items={projects}
					onItemClick={setProject}
					onSearchChange={(v) => {
						const url = getHttpsRepositoryUrl(v);
						const parsedStorageUrl = parseStorageUrl(url);
						if (parsedStorageUrl.domain !== source.domain) return;
						if (!parsedStorageUrl.group || !parsedStorageUrl.name) return setProject(null);
						setProject(`${parsedStorageUrl.group}/${parsedStorageUrl.name} `);
					}}
				/>
			</div>
		</div>
	);
};

export default CloneFields;
