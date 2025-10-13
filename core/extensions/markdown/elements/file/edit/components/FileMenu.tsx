import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import Path from "@core/FileProvider/Path/Path";
import FileTranscription from "@ext/ai/components/Audio/FileTranscription";
import { ALLOWED_MEDIA_EXTENSIONS as ALLOWED_MEDIA_EXTENSIONS_AI } from "@ext/ai/models/consts";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import Name from "./Menu/Name";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import downloadResource from "@core-ui/downloadResource";
import FetchService from "@core-ui/ApiServices/FetchService";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import resolveModule from "@app/resolveModule/frontend";
import { toast } from "@ui-kit/Toast";

interface FileMenuProps {
	resourcePath: string;
	aiEnabled: boolean;
	onDelete: () => void;
}

const FileMenu = ({ onDelete, resourcePath, aiEnabled }: FileMenuProps) => {
	const { isTauri, isBrowser, isStatic } = usePlatform();
	const workspace = WorkspaceService.current();
	const path = new Path(window.decodeURIComponent(resourcePath));
	const isMediaFile = aiEnabled && ALLOWED_MEDIA_EXTENSIONS_AI.includes(path.extension.toLowerCase());
	const apiUrlCreator = ApiUrlCreator.value;

	const onError = () =>
		toast(t("file-not-found"), {
			status: "error",
			icon: "triangle-alert",
			description: t("file-download-error-message"),
			size: "lg",
		});

	const download = async () => {
		await downloadResource(apiUrlCreator, path);
	};

	const openInSupportedApp = async () => {
		const res = await FetchService.fetch(apiUrlCreator.getResourcePath(path.value));
		if (!res.ok) return onError();

		const absolutePath = await res.text();
		try {
			await resolveModule("openInExplorer")?.(new Path(workspace.path).join(new Path(absolutePath)).value);
		} catch (error) {
			onError();
			console.error(error);
		}
	};

	return (
		<ModalLayoutDark>
			<div>
				<ButtonsLayout>
					<Name
						path={path}
						downloadResource={download}
						onError={onError}
						openInSupportedApp={openInSupportedApp}
					/>
					<div className="divider" />
					{isMediaFile && <FileTranscription path={path} />}
					{(isBrowser || isStatic) && (
						<Button icon="download" onClick={download} tooltipText={t("download")} />
					)}
					{isTauri && (
						<Button
							icon="external-link"
							onClick={openInSupportedApp}
							tooltipText={t("open-in-supported-app")}
						/>
					)}
					<Button icon="trash" onClick={onDelete} tooltipText={t("delete-file")} />
				</ButtonsLayout>
			</div>
		</ModalLayoutDark>
	);
};

export default FileMenu;
