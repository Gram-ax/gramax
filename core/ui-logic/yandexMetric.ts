/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable prefer-rest-params */
export default function yandexMetric(counter: string) {
	if (!counter) return;
	if (typeof window != "undefined") {
		(function (m, e, t, r, i, k, a) {
			m[i] =
				m[i] ||
				function () {
					(m[i].a = m[i].a || []).push(arguments);
				};
			m[i].l = 1 * (new Date() as any);
			(k = e.createElement(t)),
				(a = e.getElementsByTagName(t)[0]),
				(k.async = 1),
				(k.src = r),
				a.parentNode.insertBefore(k, a);
		})(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

		// @ts-ignore
		ym(counter, "init", {
			clickmap: true,
			trackLinks: true,
			accurateTrackBounce: true,
			webvisor: true,
		});
	}
}
