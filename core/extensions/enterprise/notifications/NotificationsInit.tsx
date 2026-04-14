import type { PageProps } from "@components/Pages/models/Pages";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import { TruncatedText } from "@ext/enterprise/components/admin/settings/metrics/view/table/TableHelpers";
import EnterpriseService from "@ext/enterprise/EnterpriseService";
import { addNotification, markNotificationAsRead } from "@ext/enterprise/notifications/NotificationStore";
import { useNotificationWebSocketStore } from "@ext/enterprise/notifications/NotificationWebSocketStore";
import type { NotificationMessage } from "@ext/enterprise/notifications/WebSocketService/NotificationWebSocketService";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import { traced } from "@ext/loggers/opentelemetry";
import { customToast, Toast } from "@ui-kit/Toast";
import { useCallback, useEffect, useMemo, useRef } from "react";

interface UseNotificationsParams {
	userEmail?: string;
	gesUrl?: string;
	token?: string;
}

const useNotifications = ({ userEmail, gesUrl, token }: UseNotificationsParams) => {
	const { connect, onNotification } = useNotificationWebSocketStore();
	const enterpriseService = useMemo(() => (gesUrl ? new EnterpriseService(gesUrl) : null), [gesUrl]);
	const handledNotificationsRef = useRef(new Set<number>());

	useEffect(() => {
		if (userEmail && gesUrl && token) {
			connect(userEmail, gesUrl, token);
		}
	}, [userEmail, gesUrl, token, connect]);

	const handleRead = useCallback(
		async (notification: NotificationMessage) => {
			if (handledNotificationsRef.current.has(notification.notificationId)) return;
			handledNotificationsRef.current.add(notification.notificationId);

			if (enterpriseService && userEmail && token) {
				try {
					await traced("NotificationsInit.markAsRead", () =>
						enterpriseService.markNotificationsAsRead(userEmail, [notification.notificationId], token),
					);
					markNotificationAsRead(notification.notificationId);
				} catch {}
			}
		},
		[enterpriseService, userEmail, token],
	);

	useEffect(() => {
		const unsubscribe = onNotification((notification) => {
			addNotification(notification);
			customToast(
				({ id, toast }) => (
					<Toast
						closeAction
						description={
							notification.previewText ? (
								<TruncatedText
									className="text-sm"
									lines={2}
									showTooltip={false}
									text={notification.previewText}
								/>
							) : undefined
						}
						focus="medium"
						onClose={() => {
							handleRead(notification);
							toast.dismiss(id);
						}}
						size="lg"
						status="default"
						title={<span className="font-semibold">{notification.articleTitle}</span>}
					/>
				),
				{ duration: 115000, onDismiss: () => handleRead(notification) },
			);
		});

		return unsubscribe;
	}, [onNotification, handleRead]);
};

export const NotificationsInit = ({ pageProps }: { pageProps: PageProps }) => {
	const userEmail = pageProps.context?.userInfo?.mail;
	const gesUrl = pageProps.context?.conf?.enterprise?.gesUrl;
	const sourceDatas = SourceDataService.value;
	const token = useMemo(
		() => (gesUrl ? getEnterpriseSourceData(sourceDatas, gesUrl)?.token : undefined),
		[sourceDatas, gesUrl],
	);

	useNotifications({ userEmail, gesUrl, token });
	return null;
};
