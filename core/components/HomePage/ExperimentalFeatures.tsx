import { getExecutingEnvironment } from "@app/resolveModule/env";
import Checkbox from "@components/Atoms/Checkbox";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { useCallback, useState } from "react";

const Wrapper = styled.span`
	display: flex;
	align-items: center;
	gap: 0.25rem;

	> a {
		padding-bottom: 0.1rem;
	}

	> div {
		cursor: pointer;
	}
`;

const ExperimentalFeatures = () => {
	if (getExecutingEnvironment() === "next") return null;

	const [cooldown, setCooldown] = useState(false);

	const callback = useCallback(async () => {
		if (typeof window === "undefined") return;

		if (cooldown) return;
		setCooldown(true);
		setTimeout(() => setCooldown(false), 500);

		window.debug.devMode.check() ? window.debug.devMode.disable() : window.debug.devMode.enable();
		getExecutingEnvironment() === "browser" ? window.location.reload() : await window.reloadAll();
	}, [cooldown]);

	if (!window.debug?.devMode) return null;

	return (
		<Wrapper>
			<div data-qa="qa-clickable">
				<Checkbox interactive checked={window.debug.devMode.check()} onClick={callback}>
					<span onClick={callback}>{t("experimental-features.label")}</span>
				</Checkbox>
			</div>
			{/* <Tooltip content={t("experimental-features.learn-more")}>
				<a target="_blank" href="https://gram.ax/resources/docs/whats-new" rel="noreferrer">
					<Icon code="circle-help" />
				</a>
			</Tooltip> */}
		</Wrapper>
	);
};

export default ExperimentalFeatures;
