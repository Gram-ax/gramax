import LanguageService from "@core-ui/ContextServices/Language";
import styled from "@emotion/styled";
import Theme from "@ext/Theme/Theme";
import ThemeService from "@ext/Theme/components/ThemeService";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import { useState, type HTMLAttributes } from "react";
import App from "./App";

const ContinueInBrowserUnstyled = ({ onClick, ...props }: { onClick: () => void } & HTMLAttributes<HTMLDivElement>) => {
	return (
		<LanguageService.Provider>
			<ThemeService.Provider value={Theme.light}>
				<div {...props}>
					<div className="container">
						<InfoModalForm
							title={t("app.continue-in-browser.title")}
							icon={{ code: "alert-circle", color: "var(--color-warning)" }}
							actionButton={{ text: t("app.continue-in-browser.action"), onClick }}
						>
							{t("app.continue-in-browser.description")}
						</InfoModalForm>
					</div>
				</div>
			</ThemeService.Provider>
		</LanguageService.Provider>
	);
};

const ContinueInBrowser = styled(ContinueInBrowserUnstyled)`
	.container {
		width: var(--default-form-width);
	}

	display: flex;
	height: 100%;
	width: 100%;
	align-items: center;
	justify-content: center;
`;

export const AppDesktopGuard = () => {
	const [isOpenInDesktop, setIsOpenInDesktop] = useState(window.desktopOpened || false);

	return isOpenInDesktop ? <ContinueInBrowser onClick={() => setIsOpenInDesktop(false)} /> : <App />;
};
