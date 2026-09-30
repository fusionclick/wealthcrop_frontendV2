import { useQuery } from "@tanstack/react-query";
import { getApi } from "../api/api";
import { laravelUrl } from "../utils/nodeApi";

/**
 * Admin → Settings, read by the investor app.
 *
 * Lived inside ModuleGate as a private hook, so it could only ever gate routes. QA 13.7 asks
 * that each setting "saves and takes effect", and the minimum lumpsum / minimum SIP amounts
 * saved correctly but reached nothing: the invest forms used the scheme's own minimum with a
 * hardcoded fallback and never asked the platform. Shared here, on the same query key, so the
 * settings are fetched once for the whole app.
 *
 * If the settings cannot be fetched the caller gets {} and falls back to the scheme's minimum —
 * a transient 500 must not block investing.
 */
export function usePlatformSettings() {
  return useQuery({
    queryKey: ["platformSettings"],
    // getApi returns the parsed body (not the axios response, unlike getApiWithToken),
    // so the settings object is one `.data` deep, not two.
    queryFn: () => getApi(laravelUrl("/platform-settings")),
    select: (res) => res?.data ?? {},
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/**
 * The minimum this investor may actually put in.
 *
 * The higher of the two floors, deliberately: the scheme's own minimum is set by the AMC and BSE
 * will reject anything under it, while the platform minimum is the distributor's own business
 * rule. Neither may be undercut, so the effective floor is whichever is larger.
 *
 * @param key    "min_lumpsum_amount" | "min_sip_amount"
 * @param scheme the scheme's own minimum, 0 when nobody published one
 */
export function useEffectiveMinimum(key, scheme) {
  const { data } = usePlatformSettings();
  const platform = Number(data?.[key]) || 0;
  const own = Number(scheme) || 0;
  return Math.max(platform, own);
}
