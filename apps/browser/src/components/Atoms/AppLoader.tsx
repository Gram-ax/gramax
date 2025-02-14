import { classNames } from "@components/libs/classNames";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useWatchClient } from "@core-ui/hooks/useWatch";
import CustomLogoDriver from "@core/utils/CustomLogoDriver";
import styled from "@emotion/styled";
import Theme from "@ext/Theme/Theme";
import ThemeService from "@ext/Theme/components/ThemeService";
import t from "@ext/localization/locale/translate";
import { useState } from "react";
import DarkLogo from "../../../../../core/public/images/gramax-logo-dark.svg";
import LightLogo from "../../../../../core/public/images/gramax-logo-light.svg";

const useCustomLogo = (theme: Theme) => {
	const defaultLogo = theme === Theme.light ? LightLogo : DarkLogo;
	const customLogo = CustomLogoDriver.getLogoWithCheckDark(theme);

	return { logo: customLogo || defaultLogo, custom: Boolean(customLogo) };
};

const AppLoader = ({ className }: { className?: string }) => {
	const { isTauri } = usePlatform();
	const [show, setShow] = useState(!isTauri);
	const theme = ThemeService.value;
	const { logo, custom } = useCustomLogo(theme);

	useWatchClient(() => {
		if (isTauri) setTimeout(() => setShow(true), 500);
	}, []);

	if (!show) return null;

	return (
		<div className={classNames(className, { "custom-logo": custom })}>
			<div className={className} data-qa="loader">
				<div className="logo-container">
					<img src={logo} alt={`logo_${theme}`} />
				</div>
				<div className="text">
					<span>{t("app.loading")}</span>
					<span className="dots" />
				</div>
			</div>
		</div>
	);
};

const AppLoaderStyled = styled(AppLoader)`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;

	margin-bottom: var(--mb-app-lodaer);
	height: 100%;
	width: 100%;
	gap: var(--gap-app-loader);

	&.custom-logo {
		--gap-app-loader: 1rem;
	}

	.logo-container {
		display: flex;
		justify-content: center;
		align-items: center;

		max-width: 20rem;
	}

	img {
		transform: scale(0.95);
		width: var(--width-image-lodaer);
		animation: pulsate 3s ease;
		animation-iteration-count: infinite;
	}

	span {
		color: var(--color-loader);
		text-align: center;
		font-weight: 500;
		font-size: 1.5rem;
	}

	.text {
		width: 100%;
		display: flex;
		margin-top: -1em;
		justify-content: center;

		.dots {
			text-align: left;
			width: 0;
		}

		.dots::after {
			content: "";
			animation: dots 1.5s steps(3, end) infinite;
		}
	}

	@keyframes pulsate {
		0% {
			transform: scale(0.95);
		}
		50% {
			transform: scale(1);
		}
		100% {
			transform: scale(0.95);
		}
	}

	@keyframes dots {
		0% {
			content: ".";
		}
		50% {
			content: "..";
		}
		100% {
			content: "...";
		}
	}
`;

export default AppLoaderStyled;
