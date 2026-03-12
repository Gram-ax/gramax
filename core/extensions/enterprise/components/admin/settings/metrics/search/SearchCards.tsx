import styled from "@emotion/styled";
import { SEARCH_CHART_COLORS } from "@ext/enterprise/components/admin/settings/metrics/search/chart/searchMetricsConfig";
import { MetricsTooltipHelper } from "@ext/enterprise/components/admin/settings/metrics/search/helpers/TooltipHelper";
import t from "@ext/localization/locale/translate";
import { Card } from "ics-ui-kit/components/card";
import { useMemo } from "react";
import type { SearchChartDataPoint } from "../types";

interface SearchCardsProps {
	data: SearchChartDataPoint[];
}

const ColoredCard = styled(Card)<{ accentColor: string }>`
	padding: 1rem 1rem 1rem 1.5rem;
	position: relative;
	border: 1px solid ${(props) => props.accentColor}30;
	border-radius: 12px;
	background-color: ${(props) => props.accentColor}15;
	box-shadow: inset 4px 0 0 ${(props) => props.accentColor};
`;

const SearchCards = ({ data }: SearchCardsProps) => {
	const totals = useMemo(() => {
		if (!data.length) {
			return {
				totalSearches: 0,
				avgCTR: 0,
				noClickRate: 0,
				refinementRate: 0,
			};
		}

		const sum = data.reduce(
			(acc, point) => ({
				totalSearches: acc.totalSearches + point.totalSearches,
				avgCTR: acc.avgCTR + point.avgCTR,
				noClickRate: acc.noClickRate + point.noClickRate,
				refinementRate: acc.refinementRate + point.refinementRate,
			}),
			{ totalSearches: 0, avgCTR: 0, noClickRate: 0, refinementRate: 0 },
		);

		const count = data.length;
		return {
			totalSearches: sum.totalSearches,
			avgCTR: Math.round(sum.avgCTR / count),
			noClickRate: Math.round(sum.noClickRate / count),
			refinementRate: Math.round(sum.refinementRate / count),
		};
	}, [data]);

	return (
		<div className="w-50 flex-shrink-0 flex flex-col justify-between">
			<ColoredCard accentColor={SEARCH_CHART_COLORS.totalSearches} className="rounded-md">
				<div className="text-sm font-normal	 text-muted mb-1">{t("metrics.chart.totalSearches")}</div>
				<div className="text-2xl font-semibold">{totals.totalSearches.toLocaleString()}</div>
			</ColoredCard>
			<ColoredCard accentColor={SEARCH_CHART_COLORS.avgCTR} className="rounded-md">
				<div className="text-sm font-normal text-muted mb-1">
					<MetricsTooltipHelper
						label={t("metrics.chart.avgCTR")}
						text={t("metrics.table.tooltips.ctr-percent")}
					/>
				</div>
				<div className="text-2xl font-semibold">{totals.avgCTR}%</div>
			</ColoredCard>
			<ColoredCard accentColor={SEARCH_CHART_COLORS.noClickRate} className="rounded-md">
				<div className="text-sm font-normal text-muted mb-1">
					<MetricsTooltipHelper
						label={t("metrics.chart.noClickRate")}
						text={t("metrics.table.tooltips.no-click-rate")}
					/>
				</div>
				<div className="text-2xl font-semibold">{totals.noClickRate}%</div>
			</ColoredCard>
			<ColoredCard accentColor={SEARCH_CHART_COLORS.refinementRate} className="rounded-md">
				<div className="text-sm font-normal text-muted mb-1">
					<MetricsTooltipHelper
						label={t("metrics.chart.refinementRate")}
						text={t("metrics.table.tooltips.refinement-rate-percent")}
					/>
				</div>
				<div className="text-2xl font-semibold">{totals.refinementRate}%</div>
			</ColoredCard>
		</div>
	);
};

export default SearchCards;
