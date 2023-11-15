import Icon from "@components/Atoms/Icon";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import { useRouter } from "../../../logic/Api/useRouter";
import localizer from "../core/Localizer";
import Language from "../core/model/Language";
import useLocalize from "../useLocalize";

const languages = Object.values(Language);

const LangToggle = styled(({ className }: { className?: string }) => {
	const currentLanguage = PageDataContextService.value.lang;
	const router = useRouter();

	const currenLangIdx = languages.findIndex((l) => l == currentLanguage);
	let newLangIdx = currenLangIdx + 1;
	if (newLangIdx >= languages.length) newLangIdx = 0;
	const newLang = languages[newLangIdx];

	const onClick = (e) => {
		e.preventDefault();
		const article = localizer.trim(router.path).split(/[/|#|?]/, 2)[1];
		router.pushPath("/" + newLang + "/" + article);
	};
	return (
		<div data-qa="app-action" onClick={onClick} className={className} style={{}}>
			<Icon code="globe" />
			<span>{useLocalize("current")}</span>
		</div>
	);
})`
	flex: 1;
	display: flex;
	cursor: pointer;
	align-items: baseline;
	color: var(--color-primary-general);

	:hover {
		color: var(--color-primary);
	}
`;

export default LangToggle;
