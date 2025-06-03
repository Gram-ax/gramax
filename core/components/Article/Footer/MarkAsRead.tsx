import Button, { TextSize } from "@components/Atoms/Button/Button";
import { useEffect, useState } from "react";
import t from "@ext/localization/locale/translate";
import Icon from "@components/Atoms/Icon";
import { showPopover } from "@core-ui/showPopover";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import useIsStorageInitialized from "@ext/storage/logic/utils/useIsStorageInitialized";

interface MarkAsReadProps {
	logicPath: string;
	apiUrlCreator: ApiUrlCreator;
}

const MarkAsRead = ({ logicPath, apiUrlCreator }: MarkAsReadProps) => {
	const [isChecked, setIsChecked] = useState(false);
	const pageData = PageDataContext.value;
	const isStorageInitialized = useIsStorageInitialized();

	useEffect(() => {
		setIsChecked(false);
	}, [logicPath]);

	if (!isStorageInitialized) return null;
	if (!pageData.conf.search.elastic.enabled) return null;
	if (!pageData.userInfo?.mail) return null;

	useEffect(() => {
		const url = apiUrlCreator.markArticleAsOpened(logicPath);
		void FetchService.fetch(url);
	}, [logicPath]);

	const updateMarkAsRead = async (): Promise<boolean> => {
		const url = apiUrlCreator.markArticleAsRead(logicPath);
		const res = await FetchService.fetch(url);
		if (res.ok) return true;
		return false;
	};

	const onButtonClick = async () => {
		const newState = !isChecked;

		const isSuccess = await updateMarkAsRead();

		if (newState && isSuccess) showPopover(t("mark-as-read-popover"));
		if (isSuccess) setIsChecked(newState);
	};

	return (
		<Button textSize={TextSize.XS} onClick={onButtonClick} isEmUnits disabled={isChecked}>
			<Icon code={isChecked ? "check-check" : "check"} />
			<span>{t(isChecked ? "already-read" : "mark-as-read")}</span>
		</Button>
	);
};

export default MarkAsRead;
