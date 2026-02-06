import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import Mode from "@ext/git/actions/Clone/model/Mode";
import CloneFields from "@ext/git/actions/Source/components/CloneFields";
import ReadOnlyUserField from "@ext/git/actions/Source/components/ReadOnlyUserField";
import GitPaginatedProjectList from "@ext/git/actions/Source/Git/logic/GitPaginatedProjectList";
import GitSourceApi from "@ext/git/actions/Source/GitSourceApi";
import type GitVerseSourceData from "@ext/git/actions/Source/GitVerse/logic/GitVerseSourceData";
import { useMakeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import { SourceUser } from "@ext/git/actions/Source/SourceAPI";
import t from "@ext/localization/locale/translate";
import { SelectFormSchemaType } from "@ext/storage/logic/SourceDataProvider/model/SelectSourceFormSchema";
import { FormField } from "@ui-kit/Form";
import { useEffect, useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";

interface SelectGitVerseStorageDataFieldsProps {
	source: GitVerseSourceData;
	mode?: "init" | "clone";
	form: UseFormReturn<SelectFormSchemaType>;
}

const SelectGitVerseStorageDataFields = (props: SelectGitVerseStorageDataFieldsProps) => {
	const { source, mode, form } = props;
	const authServiceUrl = PageDataContextService.value.conf.authServiceUrl;
	const sourceApi = useMakeSourceApi(source, authServiceUrl) as GitSourceApi;
	const gitPaginatedProjectList = useMemo(() => new GitPaginatedProjectList(sourceApi), [sourceApi]);
	const [user, setUser] = useState<SourceUser>(null);

	useEffect(() => {
		if (mode !== "init") return;
		sourceApi.getUser().then((user) => {
			setUser(user);

			form.setValue("user", {
				avatarUrl: user.avatarUrl,
				name: user.username,
				type: "User",
				htmlUrl: "", // don't work without it
			});
		});
	}, []);

	// don't render avatar for GitVerse because of CORS in browser
	if (mode === Mode.init) return <ReadOnlyUserField renderAvatar={false} user={user} />;

	return (
		<FormField
			control={({ field }) => (
				<CloneFields {...field} form={form} gitPaginatedProjectList={gitPaginatedProjectList} source={source} />
			)}
			name="repository"
			title={t("repository")}
		/>
	);
};

export default SelectGitVerseStorageDataFields;
