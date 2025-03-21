import { getExecutingEnvironment } from "@app/resolveModule/env";
import Button, { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import IconLink from "@components/Molecules/IconLink";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import useEditUrl from "./useEditUrl";

const DESKTOP_APP_LISTENING_ADDRESS = "http://127.0.0.1:52055";

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

	return (
		<div>
			<Button buttonStyle={ButtonStyle.transparent} textSize={TextSize.XS}>
				<IconLink
					onClick={() => {
						onClick
							? onClick(() => openHref(url, targetSelf ? "_self" : "_blank"))
							: openHref(url, targetSelf ? "_self" : "_blank");
					}}
					href={url}
					style={{ lineHeight: "140%" }}
					afterIconCode={"gramax"}
					text={text}
					isExternal
					target={targetSelf ? "_self" : "_blank"}
				/>
			</Button>
		</div>
	);
};

export const assertDesktopOpened = async (callback?: () => void) => {
	let attempts = 3;
	await new Promise((resolve) => setTimeout(resolve, 200));
	while (attempts--) {
		try {
			if (await fetch(DESKTOP_APP_LISTENING_ADDRESS).then((r) => r.ok)) {
				callback?.();
				return;
			}
		} catch {}
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	ErrorConfirmService.notify(
		new DefaultError(
			t("open-in.error.cannot-open-desktop.desc"),
			null,
			{ html: true },
			true,
			t("open-in.error.cannot-open-desktop.title"),
		),
	);
};

const EditInDesktop = ({ pathname, articlePath }: { pathname: string; articlePath: string }) => (
	<EditInGramaxButton
		targetSelf
		text={t("open-in.desktop")}
		pathname={pathname}
		articlePath={articlePath}
		onClick={assertDesktopOpened}
	/>
);

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
	return editInGramaxComponents[getExecutingEnvironment()]({ pathname, articlePath });
};

export default EditInGramax;
