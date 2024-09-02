import Button, { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
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
import Icon from "@ext/markdown/elements/icon/render/components/Icon";
import { useRef, useState } from "react";

const Share = ({ trigger, shouldRender = true }: { trigger: JSX.Element; shouldRender?: boolean }) => {
	if (!shouldRender) return null;

	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const copyBlockRef = useRef<HTMLDivElement>(null);
	const shareUrl = getClientDomain() + router.path;
	const { isBrowser } = usePlatform();

	const logicPath = new Path(router.path).removeExtraSymbols;
	const { branch } = RouterPathProvider.parsePath(logicPath);
	const domain = CatalogPropsService.value;

	const IconWithText = ({ iconCode, text }: { iconCode: string; text: string }) => (
		<span style={{ display: "flex", alignItems: "center", gap: "0.25em" }}>
			<Icon code={iconCode} />
			{text}
		</span>
	);

	return (
		<ModalLayout trigger={trigger} isOpen={isOpen} onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)}>
			<ModalLayoutLight>
				<FormStyle>
					<fieldset>
						<legend>
							<IconWithText iconCode="external-link" text={t("share.name")} />
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
