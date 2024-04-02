import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Icon from "@components/Atoms/Icon";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useRouter } from "@core/Api/useRouter";
import { getClientDomain } from "@core/utils/getClientDomain";
import { noteIcons } from "@ext/markdown/elements/note/render/component/Note";
import { useRef, useState } from "react";
import useLocalize from "../../../../localization/useLocalize";
import Fence from "../../../../markdown/elements/fence/render/component/Fence";

const Share = ({ trigger, shouldRender = true }: { trigger: JSX.Element; shouldRender?: boolean }) => {
	if (!shouldRender) return null;

	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const copyBlockRef = useRef<HTMLDivElement>(null);
	const shareUrl = getClientDomain() + router.path;

	const needPermissionText = useLocalize("needPermission");
	const shareDescriptionText = useLocalize("shareDescription");
	const shareInBrowserHintText = useLocalize("shareInBrowserHint");
	const { isBrowser } = usePlatform();

	return (
		<ModalLayout trigger={trigger} isOpen={isOpen} onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)}>
			<>
				<ModalLayoutLight>
					<FormStyle>
						<fieldset>
							<legend>
								<span>{useLocalize("share")}</span>
							</legend>
							<div ref={copyBlockRef} className="form-group">
								<Fence value={shareUrl} />
							</div>
							<div className="input-lable-description full-width">
								<div className="article">
									<p>
										{isBrowser && (
											<>
												<Icon code={noteIcons.none} />
												<span>{shareInBrowserHintText + ". "}</span>
												<br />
											</>
										)}
										<span>
											<b>{needPermissionText}</b>. {shareDescriptionText}
										</span>
									</p>
								</div>
							</div>

							<div className="buttons">
								<Button buttonStyle={ButtonStyle.underline} onClick={() => setIsOpen(false)}>
									{useLocalize("close")}
								</Button>
								<Button onClick={() => navigator.clipboard.writeText(shareUrl)}>
									{useLocalize("copy") + " " + useLocalize("link2").toLowerCase()}
								</Button>
							</div>
						</fieldset>
					</FormStyle>
				</ModalLayoutLight>
			</>
		</ModalLayout>
	);
};

export default Share;
