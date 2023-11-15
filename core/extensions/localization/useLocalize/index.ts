import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import Language from "../core/model/Language";
import UiLocalization from "./data.json";
import useBareLocalize from "./useBareLocalize";

const useLocalize = (text: keyof typeof UiLocalization, language?: Language): string => {
	const lang = language ?? PageDataContextService.value?.lang;
	return useBareLocalize(text, lang);
};

export default useLocalize;
