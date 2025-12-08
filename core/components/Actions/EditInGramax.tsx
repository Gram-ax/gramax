import Icon from "@components/Atoms/Icon";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import useEditUrl from "./useEditUrl";

const DESKTOP_APP_LISTENING_ADDRESS = "http://127.0.0.1:52055/";

interface EditInGramaxButtonProps {
	text: string;
	pathname: string;
	articlePath: string;
	targetSelf?: boolean;
	onClick?: (callback: () => void) => void;
}

const openHref = (href: string, target: string) => {
	const a = document.createElement("a");
	a.href = href;
	a.target = target;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
};

const EditInGramaxButton = ({ text, targetSelf, onClick, pathname, articlePath }: EditInGramaxButtonProps) => {
	const url = useEditUrl(pathname, articlePath);

	const onSelect = () => {
		onClick
			? onClick(() => openHref(url, targetSelf ? "_self" : "_blank"))
			: openHref(url, targetSelf ? "_self" : "_blank");
	};

	return (
		<DropdownMenuItem onSelect={onSelect}>
			<Icon code="gramax" />
			{text}
			<Icon code="external-link" />
		</DropdownMenuItem>
	);
};

const tryOpen = async (url: string) => {
	try {
		const controller = new AbortController();
		const id = setTimeout(() => controller.abort(), 500);
		const res = await fetch(url, { signal: controller.signal });
		clearTimeout(id);
		return res.ok;
	} catch (e) {
		console.error(e);
		return false;
	}
};

const EditInDesktop = ({ pathname, articlePath }: { pathname: string; articlePath: string }) => {
	const handleOpen = async (openProtocol: () => void) => {
		const ok = await tryOpen(DESKTOP_APP_LISTENING_ADDRESS + pathname);
		if (ok) return;

		openProtocol();

		setTimeout(() => {
			if (document.hasFocus()) {
				ErrorConfirmService.notify(
					new DefaultError(
						t("open-in.error.cannot-open-desktop.desc"),
						null,
						{ html: true },
						true,
						t("open-in.error.cannot-open-desktop.title"),
					),
				);
			}
		}, 2000);
	};

	return (
		<EditInGramaxButton
			targetSelf
			text={t("open-in.desktop")}
			pathname={pathname}
			articlePath={articlePath}
			onClick={handleOpen}
		/>
	);
};

const EditInWeb = ({ pathname, articlePath }: { pathname: string; articlePath: string }) =>
	!PageDataContextService.value?.conf.isRelease && (
		<EditInGramaxButton pathname={pathname} articlePath={articlePath} text={t("open-in.web")} />
	);

const EditInWebFromDocPortal = ({ pathname, articlePath }: { pathname: string; articlePath: string }) => (
	<EditInGramaxButton pathname={pathname} articlePath={articlePath} text={t("open-in.gramax")} />
);

const editInGramaxComponents = {
	next: EditInWebFromDocPortal,
	tauri: EditInWeb,
	browser: EditInDesktop,
};

const EditInGramax = ({ pathname, articlePath }: { pathname: string; articlePath: string }) => {
	const { environment } = usePlatform();
	return editInGramaxComponents[environment]({ pathname, articlePath });
};

export default EditInGramax;
