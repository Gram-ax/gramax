import styled from "@emotion/styled";
import Theme from "@ext/Theme/Theme";
import ThemeService from "@ext/Theme/components/ThemeService";
import t from "@ext/localization/locale/translate";
import { useEffect, useState } from "react";
import DarkLogo from "../../../../../core/public/images/gramax-logo-dark.svg";
import LightLogo from "../../../../../core/public/images/gramax-logo-light.svg";

const AppLoader = ({ className, delayBeforeShow = 0 }: { className?: string; delayBeforeShow?: number }) => {
	const theme = ThemeService.value;
	const [dotsCount, setDotsCount] = useState(0);
	const [show, setShow] = useState(false);

	useEffect(() => {
		const interval = setInterval(() => setDotsCount((prev) => (prev < 3 ? prev + 1 : 1)), 500);
		if (delayBeforeShow) setTimeout(() => setShow(true), delayBeforeShow);
		else setShow(true);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className={className}>
			<div className={className} data-qa="loader">
				{show && (
					<>
						<div className="logo-container">
							<img src={theme == Theme.light ? LightLogo : DarkLogo} />
						</div>
						<div className="text">
							<span>{t("app.loading")}</span>
							<span className="dots">{".".repeat(dotsCount)}</span>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

const AppLoaderStyled = styled(AppLoader)`
	--size: 20rem;
	--max-size: 21rem;

	@keyframes pulsate {
		0% {
			height: var(--size);
			width: var(--size);
		}
		50% {
			height: var(--max-size);
			width: var(--max-size);
		}
		100% {
			height: var(--size);
			width: var(--size);
		}
	}

	.logo-container {
		height: 6rem;
		width: var(--max-size);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	img {
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
			width: 0px;
		}
	}

	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	margin-bottom: 10%;
	height: 100%;
	width: 100%;
`;

export default AppLoaderStyled;
