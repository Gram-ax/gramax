import Link from "@components/Atoms/Link";
import Url from "@core-ui/ApiServices/Types/Url";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import { TruncatedText } from "@ext/enterprise/components/admin/settings/metrics/view/table/TableHelpers";
import type { NotificationItemFromAPI } from "@ext/enterprise/EnterpriseService";
import EnterpriseService from "@ext/enterprise/EnterpriseService";
import {
	markNotificationAsRead,
	setNotifications,
	useNotifications,
	useUnreadCount,
} from "@ext/enterprise/notifications/NotificationStore";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import t from "@ext/localization/locale/translate";
import { traced } from "@ext/loggers/opentelemetry";
import { Button } from "@ui-kit/Button";
import { Counter } from "@ui-kit/Counter";
import { Divider } from "@ui-kit/Divider";
import { EmptyState } from "@ui-kit/EmptyState";
import { Icon } from "@ui-kit/Icon";
import { Indicator } from "@ui-kit/Indicator";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// biome-ignore lint/style/noRestrictedImports: dont have inport from @ui-kit
import { Container } from "ics-ui-kit/components/container";
// biome-ignore lint/style/noRestrictedImports: dont have import from @ui-kit
import { Popover, PopoverContent, PopoverTriggerButton } from "ics-ui-kit/components/popover";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

dayjs.extend(relativeTime);

function formatRelativeTime(isoTimestamp: string): string {
	return dayjs(isoTimestamp).fromNow();
}

const NewsFeed = () => {
	const [popoverOpen, setPopoverOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(false);
	const [allNotifications, setAllNotifications] = useState<NotificationItemFromAPI[]>([]);
	const [hasMore, setHasMore] = useState(false);
	const cursorRef = useRef<{ created_at: string; id: number } | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const isFetchingRef = useRef(false);
	const initialLoadDoneRef = useRef(false);

	const context = PageDataContextService.value;
	const userEmail = context?.userInfo?.mail;
	const gesUrl = context?.conf?.enterprise?.gesUrl;
	const sourceDatas = SourceDataService.value;
	const token = gesUrl ? getEnterpriseSourceData(sourceDatas, gesUrl)?.token : undefined;

	const enterpriseService = useMemo(() => (gesUrl ? new EnterpriseService(gesUrl) : null), [gesUrl]);

	const unreadCount = useUnreadCount();
	const storeNotifications = useNotifications();

	useEffect(() => {
		if (storeNotifications.length === 0) return;
		setAllNotifications((prev) => {
			const existingIds = new Set(prev.map((n) => n.id));
			const incoming = storeNotifications
				.filter((n) => !existingIds.has(n.id))
				.map((n) => ({
					...n,
					is_read: false,
					user_email: userEmail,
				}));
			if (incoming.length === 0) return prev;
			return [...incoming, ...prev];
		});
	}, [storeNotifications, userEmail]);

	const fetchNotifications = useCallback(
		async (loadMore = false) => {
			if (!userEmail || !enterpriseService || !token || isFetchingRef.current) return;

			isFetchingRef.current = true;
			setIsLoading(true);
			setError(false);
			try {
				await traced("NewsFeed.fetchNotifications", async () => {
					const result = await enterpriseService.fetchNotificationHistory(userEmail, token, {
						cursor: loadMore ? cursorRef.current : undefined,
					});

					if (result) {
						setAllNotifications((prev) =>
							loadMore ? [...prev, ...(result.items || [])] : result.items || [],
						);
						setHasMore(result.hasMore);
						cursorRef.current = result.cursor;

						if (!loadMore) {
							const unreadItems = (result.items || []).filter((item) => !item.is_read);
							setNotifications(unreadItems);
						}
					} else {
						setError(true);
					}
				});
			} catch {
				setError(true);
			} finally {
				setIsLoading(false);
				isFetchingRef.current = false;
			}
		},
		[userEmail, enterpriseService, token],
	);

	const handleMarkAsRead = async (notificationIds?: number | number[]) => {
		if (!userEmail || !enterpriseService || !token) return;

		const ids = notificationIds
			? Array.isArray(notificationIds)
				? notificationIds
				: [notificationIds]
			: allNotifications.filter((n) => !n.is_read).map((n) => n.id);

		if (ids.length === 0) return;

		const ok = await enterpriseService.markNotificationsAsRead(userEmail, ids, token);
		if (ok) {
			ids.forEach((id) => markNotificationAsRead(id));
			setAllNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n)));
		}
	};

	const renderContent = () => {
		if (isLoading && allNotifications.length === 0) return <EmptyState>{t("notifications.loading")}</EmptyState>;
		if (error) return <EmptyState>{t("notifications.error")}</EmptyState>;
		if (allNotifications.length === 0) return <EmptyState>{t("notifications.no-notifications")}</EmptyState>;

		return (
			<>
				{allNotifications.map((notification) => (
					<Link
						className="block"
						href={Url.from({ pathname: notification.article_url })}
						key={notification.id}
						onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
					>
						<Container className="cursor-pointer relative overflow-hidden" type="round">
							{!notification.is_read && (
								<Indicator className="absolute top-1 right-1 bg-status-error" rounded size="sm" />
							)}
							<div className="flex w-full flex-col gap-2 min-w-0">
								<div className="flex flex-col gap-1 min-w-0">
									<TruncatedText
										className="text-sm font-semibold"
										text={notification.article_title}
									/>
									<div className="text-xs gap-3 flex">
										<span className="text-primary-fg">{notification.catalog_name}</span>
										<span className="text-muted">
											{formatRelativeTime(notification.created_at)}
										</span>
									</div>
								</div>
								{notification.preview_text && (
									<TruncatedText
										className="text-xs text-secondary-fg"
										lines={2}
										showTooltip={false}
										text={notification.preview_text}
									/>
								)}
							</div>
						</Container>
					</Link>
				))}
				{isLoading && allNotifications.length > 0 && <EmptyState>{t("notifications.loading-more")}</EmptyState>}
			</>
		);
	};

	const handleScroll = useCallback(() => {
		const container = scrollContainerRef.current;
		if (!container || !hasMore || isLoading) return;

		const { scrollTop, scrollHeight, clientHeight } = container;
		const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;

		if (isNearBottom) {
			void fetchNotifications(true);
		}
	}, [hasMore, isLoading, fetchNotifications]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: run once when token becomes available
	useEffect(() => {
		if (!token || initialLoadDoneRef.current) return;
		initialLoadDoneRef.current = true;
		void fetchNotifications(false);
	}, [token]);

	return (
		<Popover onOpenChange={setPopoverOpen} open={popoverOpen}>
			<div className="relative">
				<PopoverTriggerButton className="h-10 w-10 p-0" variant="ghost">
					<Icon className="w-5 h-5" icon="bell" />
				</PopoverTriggerButton>

				{unreadCount > 0 && (
					<Counter className="absolute right-0 top-0 rounded-full" size="sm" status="error">
						{unreadCount > 9 ? "9+" : unreadCount}
					</Counter>
				)}
			</div>
			<PopoverContent align="center" className="flex w-80 flex-col p-1">
				<div className="flex justify-between px-3 py-2">
					<span className="font-semibold text-primary-fg">{t("notifications.title")}</span>
					{unreadCount > 0 && (
						<Button
							className="h-[22px] px-0 pb-0.5 pt-1 text-xs text-muted font-normal"
							onClick={() => handleMarkAsRead()}
							size="xs"
							variant="text"
						>
							{t("notifications.mark-all-as-read")}
						</Button>
					)}
				</div>

				<Divider className="mx-3 w-auto" />

				<div
					className="flex flex-col pt-1 overflow-y-auto"
					onScroll={handleScroll}
					ref={scrollContainerRef}
					style={{ scrollbarWidth: "thin", maxHeight: "25rem" }}
				>
					{renderContent()}
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default NewsFeed;
