import Input from "@components/Atoms/Input";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import Path from "@core/FileProvider/Path/Path";
import OnNetworkApiErrorService from "@ext/errorHandlers/client/OnNetworkApiErrorService";
import isUrlPointsToRepo from "@ext/git/actions/Clone/logic/isUrlPointsToRepo";
import type { PublicGitStorageData } from "@ext/git/core/model/GitStorageData";
import t from "@ext/localization/locale/translate";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { useEffect, useRef, useState } from "react";

export type PublicCloneProps = {
	setStorageData: (data: PublicGitStorageData) => void;
};

const PublicClone = ({ setStorageData }: PublicCloneProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [url, setUrl] = useState<string>("");
	const [name, setName] = useState<string>("");
	const [urlError, setUrlError] = useState<string>(null);
	const [nameError, setNameError] = useState<string>(null);
	const [focusedField, setFocusedField] = useState<string>(null);
	const [isValid, setIsValid] = useState<boolean>(false);

	const gitProxyUrl = WorkspaceService.current()?.services.gitProxy.url;
	const existingDirs = useRef<string[]>([]);
	const lastSetNull = useRef(false);

	const { start: checkLink } = useDebounce(async (url: string) => {
		if (!url) {
			setIsValid(false);
			setUrlError(null);
			return;
		}

		const isUrlPointingToGit = await isUrlPointsToRepo(url, gitProxyUrl);
		setIsValid(isUrlPointingToGit);
		setUrlError(isUrlPointingToGit ? null : t("git.clone.error.public.invalid-link"));
	}, 500);

	useEffect(() => {
		if (isValid && url && name && !nameError && !urlError) {
			setStorageData?.({
				name,
				url: url?.trim(),
				source: {
					sourceType: SourceType.git,
					userName: "git",
					userEmail: "",
				},
			});
			lastSetNull.current = false;
			return;
		}

		if (!lastSetNull.current) {
			setStorageData?.(null);
			lastSetNull.current = true;
		}
	}, [url, name, nameError, urlError, isValid]);

	useEffect(() => {
		const get = async () => {
			const res = await FetchService.fetch(apiUrlCreator.getCatalogBrotherFileNames());
			if (res.ok) existingDirs.current = await res.json();
		};

		void get();
	}, [apiUrlCreator]);

	const validateName = (name: string) => {
		if (!name) {
			setNameError(t("git.clone.error.public.name-empty"));
			return false;
		}

		if (existingDirs.current?.includes(name)) {
			setNameError(t("git.clone.error.already-exist").replace("{{path}}", name));
			return false;
		}

		setNameError(null);
		return true;
	};

	const onLinkChange = (newLink: string) => {
		setUrl(newLink);

		if (!name || new Path(url).name == name || !newLink) {
			const newName = new Path(newLink).name;
			setName(newName || "");
			if (newName) validateName(newName);
		}

		setIsValid(false);
		checkLink(newLink?.trim());
	};

	return (
		<OnNetworkApiErrorService.Provider>
			<div className="form-group" style={{ marginTop: "1rem" }}>
				<div className="form-group field field-string row">
					<label className="control-label">
						<div style={{ display: "flex" }}>
							<span>{t("git.clone.public.link-title")}</span>
						</div>
					</label>
					<div className="input-lable">
						<Input
							dataQa={t("git.clone.public.link-placeholder")}
							placeholder={t("git.clone.public.link-placeholder")}
							isCode
							value={url}
							onChange={(e) => onLinkChange(e.target.value)}
							onFocus={() => setFocusedField("url")}
							errorText={urlError || nameError || null}
							showErrorText={focusedField === "url"}
						/>
					</div>
				</div>
				<div className="input-lable-description">
					<div />
					<div
						className="article"
						dangerouslySetInnerHTML={{ __html: t("git.clone.public.link-description") }}
					/>
				</div>
			</div>
		</OnNetworkApiErrorService.Provider>
	);
};

export default PublicClone;
