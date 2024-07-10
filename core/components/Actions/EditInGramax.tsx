import { getExecutingEnvironment } from "@app/resolveModule/env";
import Button, { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import IconLink from "@components/Molecules/IconLink";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import useLocalize from "@ext/localization/useLocalize";
import useEditUrl from "./useEditUrl";

const DESKTOP_APP_LISTENING_ADDRESS = "http://localhost:52055";

const EditInGramaxButton = ({
	text,
	targetSelf,
	onClick,
}: {
	text: string;
	targetSelf?: boolean;
	onClick?: () => void;
}) => {
	return (
		<li style={{ listStyleType: "none", width: "fit-content" }}>
			<Button buttonStyle={ButtonStyle.transparent} textSize={TextSize.XS}>
				<IconLink
					onClick={onClick}
					href={useEditUrl()}
					afterIconCode={"gramax"}
					text={text}
					isExternal
					target={targetSelf ? "_self" : "_blank"}
				/>
			</Button>
		</li>
	);
};

const assertDesktopAvailable = async () => {
	let attempts = 3;
	await new Promise((resolve) => setTimeout(resolve, 200));
	while (attempts--) {
		try {
			if (await fetch(DESKTOP_APP_LISTENING_ADDRESS).then((r) => r.ok)) return;
		} catch {}
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	ErrorConfirmService.notify(
		new DefaultError(
			`<a target="_blank" rel="noreferrer" href="https://gram.ax">Скачайте приложение</a><span> и попробуйте еще раз.</span>`,
			null,
			{ html: true },
			true,
			"Приложение не установлено",
		),
	);
};

const EditInDesktop = () => (
	<EditInGramaxButton targetSelf text={useLocalize("openInDesktop")} onClick={assertDesktopAvailable} />
);

const EditInWeb = () =>
	!PageDataContextService.value?.conf.isRelease && <EditInGramaxButton text={useLocalize("openInWeb")} />;

const EditInWebFromDocPortal = () => <EditInGramaxButton text={useLocalize("editOn") + " Gramax"} />;

const editInGramaxComponents = {
	next: EditInWebFromDocPortal,
	tauri: EditInWeb,
	browser: EditInDesktop,
};

const EditInGramax = ({ shouldRender }: { shouldRender: boolean }) => {
	if (!shouldRender) return null;

	return editInGramaxComponents[getExecutingEnvironment()]();
};

export default EditInGramax;
