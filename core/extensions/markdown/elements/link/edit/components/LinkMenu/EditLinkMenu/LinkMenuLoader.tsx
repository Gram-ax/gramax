import t from "@ext/localization/locale/translate";
import { CommandItem } from "@ui-kit/Command";
import { Loader } from "@ui-kit/Loader";

const getLoaderItems = () => {
	return Array.from({ length: 4 }, (_, i) => ({ key: `loader-${i}` }));
};

const CommandItemLoader = () => {
	return (
		<CommandItem className="px-2 py-1" disabled>
			<div className="flex items-center">
				<Loader className="w-3.5 h-3.5 text-inverse-primary-fg" />
				<span>{t("loading")}</span>
			</div>
		</CommandItem>
	);
};

export const LinkMenuLoader = () => {
	return getLoaderItems().map((item) => <CommandItemLoader key={item.key} />);
};
