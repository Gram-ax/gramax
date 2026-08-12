import t from "@ext/localization/locale/translate";
import { SystemState, SystemStateCode, SystemStateDescription, SystemStateTitle } from "@ui-kit/SystemState";

const ForbiddenPage = () => {
	return (
		<div className="flex items-center justify-center h-screen">
			<div className="w-full max-w-md">
				<SystemState>
					<SystemStateCode>403</SystemStateCode>
					<SystemStateTitle>{t("enterprise.admin.forbidden.title")}</SystemStateTitle>
					<SystemStateDescription>{t("enterprise.admin.forbidden.description")}</SystemStateDescription>
				</SystemState>
			</div>
		</div>
	);
};

export default ForbiddenPage;
