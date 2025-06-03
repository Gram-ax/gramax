import Button, { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Checkbox from "@components/Atoms/Checkbox";
import IconWithText from "@components/Atoms/Icon/IconWithText";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ButtonLink from "@components/Molecules/ButtonLink";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import CodeBlock from "@ext/markdown/elements/codeBlockLowlight/render/component/CodeBlock";
import { MouseEvent, useMemo, useRef, useState } from "react";

interface ShareProps {
	path: string;
	shareUrl: string;
	onCopy: (e: MouseEvent) => void;
	setShouldSkipModal: (shouldShowModal: boolean) => void;
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	isArticle?: boolean;
}

const CheckboxWrapper = styled.div`
	padding-top: 0.5rem;
`;

const ShareModal = ({ path, shareUrl, setShouldSkipModal, isOpen, setIsOpen, isArticle, onCopy }: ShareProps) => {
	const [skipModal, setSkipModal] = useState(null);

	const copyBlockRef = useRef<HTMLDivElement>(null);

	const router = useRouter();
	const { isBrowser } = usePlatform();

	const { refname: branch } = useMemo(() => {
		const newPath = path || router.path;
		const logicPath = new Path(newPath).removeExtraSymbols;
		return RouterPathProvider.parsePath(logicPath);
	}, [path]);

	const domain = CatalogPropsService.value;
	const legend: string = isArticle ? t("share.name.article") : t("share.name.catalog");

	return (
		<ModalLayout isOpen={isOpen} onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)}>
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
						<CheckboxWrapper>
							<Checkbox onChange={setSkipModal}>{t("do-not-show-again")}</Checkbox>
						</CheckboxWrapper>
						<div className="buttons">
							<Button buttonStyle={ButtonStyle.underline} onClick={() => setIsOpen(false)}>
								{t("close")}
							</Button>
							<ButtonLink
								buttonStyle={ButtonStyle.default}
								textSize={TextSize.M}
								onClick={(e: MouseEvent) => {
									onCopy(e);
									setShouldSkipModal(skipModal);
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

export default ShareModal;
