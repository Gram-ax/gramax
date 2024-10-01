import Input from "@components/Atoms/Input";
import parseStorageUrl from "@core/utils/parseStorageUrl";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import t from "@ext/localization/locale/translate";
import { useState } from "react";
import GitStorageData from "../../../../core/model/GitStorageData";
import Mode from "@ext/git/actions/Clone/model/Mode";

interface SelectGitStorageDataFieldsProps {
	source: GitSourceData;
	mode?: Mode;
	onChange?: (data: GitStorageData) => void;
}

const SelectGitStorageDataFields = (props: SelectGitStorageDataFieldsProps) => {
	const { source, mode, onChange } = props;

	const [isErrorLink, setIsErrorLink] = useState(false);
	const exampleLink = `${source.protocol ?? "https"}://${source.domain}/<group-name>/<repository-name>`;

	if (mode !== Mode.clone) return null;
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
						if (protocol === source.protocol && group && name) {
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
