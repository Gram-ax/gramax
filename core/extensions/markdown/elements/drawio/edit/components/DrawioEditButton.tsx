import FetchService from "@core-ui/ApiServices/FetchService";
import { Base64ToDataImage, DataImageToBase64, isDataImage } from "@core-ui/Base64Converter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import getDrawioID from "@ext/markdown/elements/drawio/edit/logic/getDrawioID";
import { useCallback, useState } from "react";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import LogsLayout from "@components/Layouts/LogsLayout";
import Modal from "@components/Layouts/Modal";
import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import DiagramEditor from "@ext/markdown/elements/drawio/logic/diagram-editor";
import LanguageService from "@core-ui/ContextServices/Language";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import t from "@ext/localization/locale/translate";

interface DrawioEditButtonProps {
	src: string;
	trigger: boolean;
	logicPath?: string;
}

const DrawioEditButton = ({ src, trigger = false, logicPath }: DrawioEditButtonProps) => {
	const [isLoading, setIsLoading] = useState(!trigger ? true : false);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const getImgTag = useCallback(
		() => (document.getElementById(getDrawioID(src, logicPath)) ?? {}) as HTMLImageElement,
		[src, logicPath],
	);

	const setImgData = useCallback(() => {
		const imagData = getImgTag().src;
		if (!isDataImage(imagData)) {
			getImgTag().src = Base64ToDataImage(OnLoadResourceService.getBuffer(src).toString("base64"));
		}
	}, [src, getImgTag]);

	const saveCallBack = useCallback(async () => {
		setImgData();
		const imagData = getImgTag().src;
		const newBase64Img = DataImageToBase64(imagData);
		const buffer = Buffer.from(newBase64Img, "base64");
		await FetchService.fetch(apiUrlCreator.setArticleResource(src), buffer);
		OnLoadResourceService.update(src, buffer);
	}, [src, getImgTag, setImgData, apiUrlCreator]);

	OnLoadResourceService.useGetContent(
		src,
		apiUrlCreator,
		useCallback(() => setImgData(), [setImgData]),
	);

	const onClick = useCallback(() => {
		ArticleUpdaterService.stopLoadingAfterFocus();
		setImgData();
		setIsLoading(true);
		const de = DiagramEditor.editElement(
			getImgTag(),
			saveCallBack,
			() => setIsLoading(false),
			null,
			"modern",
			null,
			["splash=0", `lang=${LanguageService.currentUi()}`, "pv=0"],
		);
		window.history.pushState({}, document.location.href, "");
		window.addEventListener("popstate", () => de.stopEditing(), { once: true });
	}, [setImgData, getImgTag]);

	return (
		<>
			<Modal isOpen={isLoading}>
				<LogsLayout style={{ overflow: "hidden" }}>
					<SpinnerLoader fullScreen />
				</LogsLayout>
			</Modal>
			{trigger && <Button icon={"pencil"} tooltipText={t("edit2")} onClick={onClick} />}
		</>
	);
};

export default DrawioEditButton;
