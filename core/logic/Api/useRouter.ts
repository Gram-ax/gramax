import resolveModule from "@app/resolveModule/frontend";
import Localizer from "@ext/localization/core/Localizer";
import { Router } from "./Router";

const rules = [Localizer.sanitize.bind(Localizer)];

export const useRouter = (): Router => resolveModule("Router").use(rules);
