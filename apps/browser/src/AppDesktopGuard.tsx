import LanguageService from "@core-ui/ContextServices/Language";
import styled from "@emotion/styled";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import ThemeService from "@ext/Theme/components/ThemeService";
import { type HTMLAttributes, useState } from "react";
import App from "./App";

const ContinueInBrowserUnstyled = ({ onClick, ...props }: { onClick: () => void } & HTMLAttributes<HTMLDivElement>) => {
	return (
		<LanguageService.Init>
			<ThemeService.Provider>
				<div {...props}>
					<div className="container">
						<InfoModalForm
							actionButton={{ text: t("app.continue-in-browser.action"), onClick }}
							icon={{ code: "alert-circle", color: "var(--color-warning)" }}
							title={t("app.continue-in-browser.title")}
						>
							{t("app.continue-in-browser.description")}
						</InfoModalForm>
					</div>
				</div>
			</ThemeService.Provider>
		</LanguageService.Init>
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
