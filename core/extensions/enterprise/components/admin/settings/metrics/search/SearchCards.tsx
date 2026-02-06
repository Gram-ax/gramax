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
			avgCTR: sum.avgCTR / count,
			noClickRate: sum.noClickRate / count,
			refinementRate: sum.refinementRate / count,
		};
	}, [data]);

	return (
		<div className="w-50 flex-shrink-0 flex flex-col justify-between">
			<ColoredCard accentColor={SEARCH_CHART_COLORS.totalSearches} className="rounded-md">
				<div className="text-sm text-muted mb-1">{t("metrics.chart.totalSearches")}</div>
				<div className="text-2xl font-semibold">{totals.totalSearches.toLocaleString()}</div>
			</ColoredCard>
			<ColoredCard accentColor={SEARCH_CHART_COLORS.avgCTR} className="rounded-md">
				<div className="flex gap-1 items-center text-sm text-muted mb-1">
					{t("metrics.chart.avgCTR")}
					<MetricsTooltipHelper text={t("metrics.table.tooltips.ctr-percent")} />
				</div>
				<div className="text-2xl font-semibold">{totals.avgCTR.toFixed(2)}%</div>
			</ColoredCard>
			<ColoredCard accentColor={SEARCH_CHART_COLORS.noClickRate} className="rounded-md">
				<div className="flex gap-1 items-center text-sm text-muted mb-1">
					{t("metrics.chart.noClickRate")}
					<MetricsTooltipHelper text={t("metrics.table.tooltips.no-click-rate")} />
				</div>
				<div className="text-2xl font-semibold">{totals.noClickRate.toFixed(2)}%</div>
			</ColoredCard>
			<ColoredCard accentColor={SEARCH_CHART_COLORS.refinementRate} className="rounded-md">
				<div className="flex gap-1 items-center text-sm text-muted mb-1">
					{t("metrics.chart.refinementRate")}{" "}
					<MetricsTooltipHelper text={t("metrics.table.tooltips.refinement-rate-percent")} />
				</div>
				<div className="text-2xl font-semibold">{totals.refinementRate.toFixed(2)}%</div>
			</ColoredCard>
		</div>
	);
};

export default SearchCards;
