import Button, { TextSize } from "@components/Atoms/Button/Button";
import Icon from "@components/Atoms/Icon";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { showPopover } from "@core-ui/showPopover";
import t from "@ext/localization/locale/translate";
import { useIsRepoOk } from "@ext/storage/logic/utils/useStorage";
import { useEffect, useState } from "react";

interface MarkAsReadProps {
	logicPath: string;
	apiUrlCreator: ApiUrlCreator;
}

const MarkAsRead = ({ logicPath, apiUrlCreator }: MarkAsReadProps) => {
	const [isChecked, setIsChecked] = useState(false);
	const pageData = PageDataContext.value;
	const isRepoOk = useIsRepoOk();

	const enabled = isRepoOk && pageData.conf.search.elastic.enabled && pageData.userInfo?.mail;

	useEffect(() => {
		if (!enabled) return;

		setIsChecked(false);
		const url = apiUrlCreator.markArticleAsOpened(logicPath);
		void FetchService.fetch(url, null, MimeTypes.text, Method.POST, false);
	}, [enabled, logicPath, apiUrlCreator]);

	const updateMarkAsRead = async (): Promise<boolean> => {
		const url = apiUrlCreator.markArticleAsRead(logicPath);
		const res = await FetchService.fetch(url);
		return res.ok;
	};

	const onButtonClick = async () => {
		const newState = !isChecked;
		const isSuccess = await updateMarkAsRead();
		if (newState && isSuccess) showPopover(t("mark-as-read-popover"));
		if (isSuccess) setIsChecked(newState);
	};

	if (!enabled) return null;

	return (
		<Button textSize={TextSize.XS} onClick={onButtonClick} isEmUnits disabled={isChecked}>
			<Icon code={isChecked ? "check-check" : "check"} />
			<span>{t(isChecked ? "already-read" : "mark-as-read")}</span>
		</Button>
	);
};

export default MarkAsRead;
