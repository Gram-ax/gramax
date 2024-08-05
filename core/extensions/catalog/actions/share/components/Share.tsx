import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Icon from "@components/Atoms/Icon";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useRouter } from "@core/Api/useRouter";
import { getClientDomain } from "@core/utils/getClientDomain";
import t from "@ext/localization/locale/translate";
import { useRef, useState } from "react";
import Fence from "../../../../markdown/elements/fence/render/component/Fence";

const Share = ({ trigger, shouldRender = true }: { trigger: JSX.Element; shouldRender?: boolean }) => {
	if (!shouldRender) return null;

	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const copyBlockRef = useRef<HTMLDivElement>(null);
	const shareUrl = getClientDomain() + router.path;

	const { isBrowser } = usePlatform();

	return (
		<ModalLayout trigger={trigger} isOpen={isOpen} onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)}>
			<>
				<ModalLayoutLight>
					<FormStyle>
						<fieldset>
							<legend>
								<span>{t("share.name")}</span>
							</legend>
							<div ref={copyBlockRef} className="form-group">
								<Fence value={shareUrl} />
							</div>
							<div className="input-lable-description full-width">
								<div className="article">
									<p>
										{isBrowser && (
											<>
												<Icon code={"circle-alert"} />
												<span>{t("share.hint") + ". "}</span>
												<br />
											</>
										)}
										<span>
											<b>{t("share.error.need-permission")}</b>. {t("share.desc")}
										</span>
									</p>
								</div>
							</div>

							<div className="buttons">
								<Button buttonStyle={ButtonStyle.underline} onClick={() => setIsOpen(false)}>
									{t("close")}
								</Button>
								<Button onClick={() => navigator.clipboard.writeText(shareUrl)}>
									{t("copy") + " " + t("link2").toLowerCase()}
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
