import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import FormattedBranch from "@ext/git/actions/Branch/components/FormattedBranch";
import t from "@ext/localization/locale/translate";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import { Dialog, DialogBody, DialogContent, DialogFooterTemplate } from "@ui-kit/Dialog";
import { FormHeader } from "@ui-kit/Form";
import { type MouseEvent, useMemo, useRef, useState } from "react";

interface ShareProps {
	path: string;
	shareUrl: string;
	isArticle?: boolean;
	setShouldSkipModal: (shouldShowModal: boolean) => void;
	onCopy?: (e: MouseEvent) => void;
	onClose?: () => void;
}

const ShareModal = (props: ShareProps) => {
	const { path, shareUrl, setShouldSkipModal, isArticle, onCopy, onClose } = props;
	const [skipModal, setSkipModal] = useState(null);

	const copyBlockRef = useRef<HTMLDivElement>(null);

	const router = useRouter();
	const { isBrowser } = usePlatform();

	const { refname: branch } = useMemo(() => {
		const newPath = path || router.path;
		const logicPath = new Path(newPath).removeExtraSymbols;
		return RouterPathProvider.parsePath(logicPath);
	}, [path, router.path]);

	const sourceName = useCatalogPropsStore((state) => state.data?.sourceName);
	const legend: string = isArticle ? t("share.name.article") : t("share.name.catalog");
	const description: string = isArticle ? t("share.description.article") : t("share.description.catalog");

	const onOpenChange = (open: boolean) => {
		if (!open) onClose?.();
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={true}>
			<DialogContent>
				<FormHeader description={description} icon="external-link" title={legend} />
				<DialogBody>
					<div className="article">
						<p>
							{t("share.copy")}
							{branch && <FormattedBranch name={branch} />}
						</p>
						<div ref={copyBlockRef}>
							<CodeBlock>{shareUrl}</CodeBlock>
						</div>
						{isBrowser && <p>{t("share.hint")}</p>}
						<p
							dangerouslySetInnerHTML={{
								// biome-ignore lint/style/useNamingConvention: expected
								__html: t("share.desc").replace("{{domain}}", sourceName),
							}}
						/>
					</div>
				</DialogBody>
				<DialogFooterTemplate
					checkboxLabel={t("do-not-show-again")}
					checkboxProps={{ onChange: setSkipModal }}
					primaryButton={t("copy")}
					primaryButtonProps={{
						onClick: (e) => {
							onCopy?.(e);
							setShouldSkipModal(skipModal);
							onOpenChange(false);
						},
						variant: "primary",
					}}
					secondaryButton={t("cancel")}
					secondaryButtonProps={{ onClick: () => onOpenChange(false) }}
				/>
			</DialogContent>
		</Dialog>
	);
};

export default ShareModal;
