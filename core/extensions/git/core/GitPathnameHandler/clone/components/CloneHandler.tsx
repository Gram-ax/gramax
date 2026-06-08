import { useRouter } from "@core/Api/useRouter";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import CloneWithShareData from "@ext/catalog/actions/share/components/CloneWithShareData";
import type ShareData from "@ext/catalog/actions/share/model/ShareData";
import OnNetworkApiErrorService from "@ext/errorHandlers/client/OnNetworkApiErrorService";
import t from "@ext/localization/locale/translate";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogIcon,
	AlertDialogTitle,
} from "@ui-kit/AlertDialog";
import { useEffect, useState } from "react";

const CloneHandler = ({ shareData }: { shareData: ShareData }) => {
	const router = useRouter();
	const [clone, setClone] = useState(false);
	const [isOpen, setIsOpen] = useState(true);
	const [clonePath, setClonePath] = useState("");
	const { isBrowser } = usePlatform();

	const close = () => {
		setIsOpen(false);
		ModalToOpenService.resetValue();
	};

	useEffect(() => {
		if (!isOpen) return;
		setClonePath(window.location.pathname);
		router.pushPath("/");
	}, [isOpen, router.pushPath]);

	return (
		<>
			{clone ? (
				<OnNetworkApiErrorService.Provider callback={close}>
					<CloneWithShareData
						clonePath={clonePath}
						onCloneStart={close}
						onCreateSourceDataClose={(success) => {
							if (!success) close();
						}}
						shareData={shareData}
					/>
				</OnNetworkApiErrorService.Provider>
			) : (
				<AlertDialog open={isOpen}>
					<AlertDialogContent status="warning">
						<AlertDialogHeader>
							<AlertDialogIcon icon="alert-circle" />
							<AlertDialogTitle>{t("git.clone.not-cloned.title")}</AlertDialogTitle>
							<AlertDialogDescription asChild>
								<div className="article bg-transparent">
									<div className="article-body">
										<p>{t("git.clone.not-cloned.body")}</p>
										{isBrowser && (
											<p>
												<a
													data-testid="open-in-app-link"
													href={`gramax://${clonePath}`}
													style={{ outline: 0 }}
												>
													{t("git.clone.open-in-app")}
												</a>
											</p>
										)}
									</div>
								</div>
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel onClick={close} variant="outline">
								{t("cancel")}
							</AlertDialogCancel>
							<AlertDialogAction onClick={() => setClone(true)} variant="primary">
								{t("catalog.clone")}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</>
	);
};

export default CloneHandler;
