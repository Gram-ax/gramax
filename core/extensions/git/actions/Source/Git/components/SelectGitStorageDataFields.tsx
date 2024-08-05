import Input from "@components/Atoms/Input";
import parseStorageUrl from "@core/utils/parseStorageUrl";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import t from "@ext/localization/locale/translate";
import { useState } from "react";
import GitStorageData from "../../../../core/model/GitStorageData";

interface SelectGitStorageDataFieldsProps {
	source: GitSourceData;
	forClone?: boolean;
	onChange?: (data: GitStorageData) => void;
}

const SelectGitStorageDataFields = (props: SelectGitStorageDataFieldsProps) => {
	const { source, forClone, onChange } = props;

	const [isErrorLink, setIsErrorLink] = useState(false);
	const exampleLink = `${source.protocol ?? "https"}://${source.domain}/<group-name>/<repository-name>`;

	if (!forClone) return null;
	return (
		<div className="form-group field field-string row">
			<label className="control-label">{t("git.clone.repo-link")}</label>
			<div className="input-lable">
				<Input
					isCode
					placeholder={exampleLink}
					errorText={isErrorLink ? `${t("git.source.error.unsupported-link")} '${exampleLink}'` : null}
					onChange={(e) => {
						const url = e.target.value ?? "";
						if (url === "") {
							setIsErrorLink(false);
							onChange(null);
							return;
						}
						if (!source.protocol) source.protocol = "https";
						const { group, name, protocol } = parseStorageUrl(url);
						const testGroup = url.split(source.domain)?.[1]?.split?.("/")?.[1];
						const testName = url.split(source.domain)?.[1]?.split?.("/")?.[2]?.split(".")?.[0];
						if (protocol === source.protocol && group && name && testName === name && testGroup === group) {
							setIsErrorLink(false);
							onChange({ source, group, name });
							return;
						}
						setIsErrorLink(true);
						onChange(null);
					}}
				/>
			</div>
		</div>
	);
};

export default SelectGitStorageDataFields;
