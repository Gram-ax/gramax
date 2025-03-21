import Button, { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import IconWithText from "@components/Atoms/Icon/IconWithText";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ButtonLink from "@components/Molecules/ButtonLink";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { showPopover } from "@core-ui/showPopover";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { getClientDomain } from "@core/utils/getClientDomain";
import t from "@ext/localization/locale/translate";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import { useRef, useState } from "react";

interface ShareProps {
	trigger: JSX.Element;
	shouldRender?: boolean;
	path?: string;
	isArticle?: boolean;
}

const Share = ({ trigger, shouldRender = true, path, isArticle = true }: ShareProps) => {
	if (!shouldRender) return null;

	const [isOpen, setIsOpen] = useState(false);

	const copyBlockRef = useRef<HTMLDivElement>(null);

	const router = useRouter();
	const { isBrowser } = usePlatform();

	const newPath = path || router.path;
	const shareUrl = `${getClientDomain()}/${newPath}`;

	const logicPath = new Path(newPath).removeExtraSymbols;
	const { refname: branch } = RouterPathProvider.parsePath(logicPath);
	const domain = CatalogPropsService.value;
	const legend = isArticle ? t("share.name.article") : t("share.name.catalog");

	return (
		<ModalLayout trigger={trigger} isOpen={isOpen} onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)}>
			<ModalLayoutLight>
				<FormStyle>
					<fieldset>
						<legend>
							<IconWithText iconCode="external-link" text={legend} />
						</legend>
						<span className="article">
							{t("share.copy")}
							{branch ? (
								<>
									<b>{branch}</b>:
								</>
							) : null}
						</span>
						<div ref={copyBlockRef} className="form-group">
							<CodeBlock value={shareUrl} />
						</div>
						<div className="input-lable-description full-width">
							<div className="article">
								<p>{isBrowser && <IconWithText iconCode="circle-alert" text={t("share.hint")} />}</p>
								<p>
									<span
										dangerouslySetInnerHTML={{
											__html: t("share.desc").replace("{{domain}}", domain.sourceName),
										}}
									/>
								</p>
							</div>
						</div>
						<div className="buttons">
							<Button buttonStyle={ButtonStyle.underline} onClick={() => setIsOpen(false)}>
								{t("close")}
							</Button>
							<ButtonLink
								buttonStyle={ButtonStyle.default}
								textSize={TextSize.M}
								onClick={() => {
									navigator.clipboard.writeText(shareUrl);
									showPopover(t("share.popover"));
									setIsOpen(false);
								}}
								iconCode="copy"
								text={`${t("copy")} ${t("link2").toLowerCase()}`}
							/>
						</div>
					</fieldset>
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default Share;
