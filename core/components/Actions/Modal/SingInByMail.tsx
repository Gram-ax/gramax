import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useState } from "react";
import useLocalize from "../../../extensions/localization/useLocalize";
import Button from "../../Atoms/Button/Button";
import Icon from "../../Atoms/Icon";
import ModalLayout from "../../Layouts/Modal";
import ModalLayoutLight from "../../Layouts/ModalLayoutLight";
import Input from "@components/Atoms/Input";

const SingInByMail = () => {
	const mailRegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/gm;
	const [mail, setMail] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const sendToken = () => {
		setIsOpen(false);
		const url = apiUrlCreator.getSendMailTokenUrl(mail);
		FetchService.fetch(url);
	};

	return (
		<ModalLayout
			setGlobalsStyles
			isOpen={isOpen}
			onOpen={() => setIsOpen(true)}
			onClose={() => setIsOpen(false)}
			trigger={
				<div>
					<a>
						<Icon code={"envelope"} faFw />
						<span>{useLocalize("byMail")}</span>
					</a>
				</div>
			}
		>
			<ModalLayoutLight className="block-elevation-2">
				<div className="form small-code article block-elevation-3">
					<h2>{useLocalize("authorizationByMail")}</h2>
					<label>{useLocalize("mail")}</label>
					<div className="catalog-url-slag margin-bottom">
						<Input
							value={mail}
							className="none-border"
							onChange={(e) => setMail(e.currentTarget.value)}
							placeholder="Mail"
						/>
					</div>
					<div className="article global">
						<Button disabled={!(!!mail && mailRegExp.test(mail))} onClick={sendToken}>
							<span> {useLocalize("submitLoginLink")}</span>
						</Button>
					</div>
				</div>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default SingInByMail;
