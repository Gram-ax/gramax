// biome-ignore lint/style/noRestrictedImports: legacy styled component, migrate to Tailwind later
import styled from "@emotion/styled";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import { type HTMLAttributes, useState } from "react";
import App from "./App";

const ContinueInWebUnstyled = ({ onClick, ...props }: { onClick: () => void } & HTMLAttributes<HTMLDivElement>) => {
	return (
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
	);
};

const ContinueInWeb = styled(ContinueInWebUnstyled)`
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

	return isOpenInDesktop ? <ContinueInWeb onClick={() => setIsOpenInDesktop(false)} /> : <App />;
};
