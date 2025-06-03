import ActionConfirm from "@components/Atoms/ActionConfirm";
import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import t from "@ext/localization/locale/translate";

const DO_NOT_SHOW_AGAIN = "languages.skip-warn";

export const shouldShowActionWarning = (catalogProps: ClientCatalogProps) =>
	catalogProps?.supportedLanguages?.length > 1;

export type ActionWarningProps = {
	children?: JSX.Element;
	action: (...args: any[]) => void;
	catalogProps: ClientCatalogProps;
	isDelete?: boolean;
	onClose?: () => void;
	isOpen?: boolean;
	className?: string;
};

const OtherLanguagesPresentWarning = ({
	children,
	action,
	catalogProps,
	onClose,
	isDelete,
	isOpen: initialIsOpen,
	className,
}: ActionWarningProps) => {
	return (
		<ActionConfirm
			initialIsOpen={initialIsOpen}
			onConfirm={action}
			onClose={onClose}
			confirmTitle={isDelete ? t("multilang.warning.delete.title") : t("multilang.warning.action.title")}
			confirmBody={isDelete ? t("multilang.warning.delete.body") : t("multilang.warning.action.body")}
			shouldShow={() => shouldShowActionWarning(catalogProps)}
			doNotShowAgainKey={DO_NOT_SHOW_AGAIN}
			className={className}
		>
			{children}
		</ActionConfirm>
	);
};

export default OtherLanguagesPresentWarning;
