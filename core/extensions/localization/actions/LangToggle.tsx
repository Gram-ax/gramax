import ButtonLink from "@components/Molecules/ButtonLink";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import Path from "@core/FileProvider/Path/Path";
import styled from "@emotion/styled";
import { useRouter } from "@core/Api/useRouter";
import Language from "../core/model/Language";
import useLocalize from "@ext/localization/useLocalize";

const languages = Object.values(Language);

const LangToggle = styled(({ className }: { className?: string }) => {
	const currentLanguage = PageDataContextService.value.lang;
	const catalogProps = CatalogPropsService.value;
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const router = useRouter();

	const currenLangIdx = languages.findIndex((l) => l == currentLanguage);
	let newLangIdx = currenLangIdx + 1;
	if (newLangIdx >= languages.length) newLangIdx = 0;
	const newLang = languages[newLangIdx];

	const onClick = (e) => {
		e.preventDefault();
		router.pushPath(new Path(["/" + newLang, catalogProps?.link.pathname]).value);
	};

	if (!isReadOnly) return null;

	return (
		<ButtonLink onClick={onClick} className={className} iconCode="globe" text={useLocalize("current")} />
	);
})`
	flex: 1;
	display: flex;
	align-items: baseline;
`;

export default LangToggle;
