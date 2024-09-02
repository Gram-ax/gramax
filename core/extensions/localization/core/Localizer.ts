import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { ContentLanguage } from "./model/Language";

export type AddLanguagePath = {
	logicPath: string;
	target: ContentLanguage;
	current: ContentLanguage;
	primaryLanguage?: ContentLanguage;
};

export type AddLanguagePathname = {
	pathname: string;
} & AddLanguagePath;

class Localizer {
	extract(path: string): ContentLanguage {
		if (!path) return;
		const [, , maybeLanguage] = path.split("/", 3);
		return ContentLanguage[maybeLanguage];
	}

	addPathname({ logicPath, pathname, target, current, primaryLanguage }: AddLanguagePathname): string {
		const split = logicPath?.split("/") || [""];
		split.shift();
		if (ContentLanguage[split.at(0)] == current) split.shift();

		const path = RouterPathProvider.updatePathnameData(pathname.split("/") || [], {
			filePath: !primaryLanguage || target == primaryLanguage ? [...split] : [target, ...split],
		}).value;
		return path;
	}

	addPath({ logicPath, target, current, primaryLanguage }: AddLanguagePath) {
		const [name, maybeLanguage, ...rest] = logicPath.split("/").filter((x) => x);

		let path: string;
		if (primaryLanguage == current) path = ["", name, target, maybeLanguage, ...rest].join("/");
		else if (primaryLanguage == target) path = ["", name, ...rest].join("/");
		else path = ["", name, target, ...rest].join("/");

		return path;
	}

	trim(logicPath: string, supportedLanguages: ContentLanguage[]) {
		const split = logicPath.split("/");
		if (supportedLanguages.includes(ContentLanguage[split.at(1)])) split.splice(1, 1);
		return split.join("/");
	}

	sanitize(path: string): string {
		return (path[0] == "/" ? path : "/" + path).replaceAll("//", "/");
	}
}

export default new Localizer();
