import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ButtonLink from "@components/Molecules/ButtonLink";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import LoggedIn from "@ext/static/components/LoggedIn";
import LoginGoogle from "@ext/static/components/LoginGoogle";
import Uploaded from "@ext/static/components/Uploaded";
import CloudApi from "@ext/static/logic/CloudApi";
import { useEffect, useRef, useState } from "react";

const UploadCloud = () => {
	const isLoggedIn = useRef<boolean>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [state, setState] = useState<"loading" | "loggedIn" | "notLoggedIn" | "uploaded">("loading");
	const [clientName, setClientName] = useState<string>(null);
	const [uploadedUrl, setUploadedUrl] = useState<string>("");
	const error = useRef<DefaultError>(null);
	const cloudServiceUrl = PageDataContextService.value.conf.cloudServiceUrl;
	const [staticApi] = useState(() => new CloudApi(cloudServiceUrl, (e) => (error.current = e)));

	const setAuthStatus = async () => {
		if (!(await staticApi.getServerState())) {
			error.current = new DefaultError(t("cloud.error.failed-to-connect"));
			return;
		}

		const clientName = await staticApi.getAuthClientName();
		if (clientName) {
			setClientName(clientName);
			isLoggedIn.current = true;
			setState("loggedIn");
		} else {
			isLoggedIn.current = false;
			setState("notLoggedIn");
		}
	};

	const loading = (
		<FormStyle>
			<>
				<legend>{t("loading2")}</legend>
				<SpinnerLoader height={100} width={100} fullScreen />
			</>
		</FormStyle>
	);

	const closeIfError = () => {
		if (!isOpen || !error.current) return;
		ErrorConfirmService.notify(error.current);
		error.current = null;
		setIsOpen(false);
	};

	useEffect(closeIfError, [isOpen]);

	return (
		<ModalLayout
			isOpen={isOpen}
			onOpen={() => {
				setIsOpen(true);
			}}
			onClose={() => {
				setIsOpen(false);

				// need to delay setState to prevent interface flashing
				setTimeout(() => setState(isLoggedIn.current ? "loggedIn" : "notLoggedIn"));
			}}
			trigger={
				<ButtonLink
					text={t("cloud.upload-catalog")}
					iconCode="cloud-upload"
					onMouseEnter={() => {
						if (typeof isLoggedIn.current === "boolean") return;
						void setAuthStatus();
					}}
				/>
			}
		>
			<ModalLayoutLight>
				{state === "loading" && loading}
				{state === "notLoggedIn" && (
					<LoginGoogle
						onLogin={() => {
							void setAuthStatus();
						}}
					/>
				)}
				{state === "loggedIn" && (
					<LoggedIn
						clientName={clientName}
						onError={() => setIsOpen(false)}
						onUpload={(url) => {
							setState("uploaded");
							setUploadedUrl(url);
						}}
					/>
				)}
				{state === "uploaded" && <Uploaded url={uploadedUrl} onOkClick={() => setIsOpen(false)} />}
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default UploadCloud;
