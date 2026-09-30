import { useQuery } from "@tanstack/react-query";
import { postApiWithToken } from "../api/api";
import { nodeUrl, xspItems } from "../utils/nodeApi";

/**
 * QA — "SIP active hai phir bhi dashboard par show ni ho rahi".
 *
 * The dashboard counted active SIPs as `funds.filter(f => f.sip_status === "ACTIVE")`, where
 * `funds` is the merge of Laravel orders and BSE holdings. A SIP registration is not a holding
 * and not an order: it lives in BSE's sxp list, reached through getAllXsp, which is where the
 * Manage SIPs page reads it. Nothing ever put a `sip_status` on a holding row, so that filter
 * could only ever return 0 and the tile always read "0 Active SIPs".
 *
 * Counted from the same source Manage SIPs uses, so the two screens cannot disagree.
 */
export function useActiveSipCount(ucc) {
  const { data, isLoading } = useQuery({
    queryKey: ["activeSipCount", ucc],
    queryFn: () =>
      postApiWithToken(nodeUrl(import.meta.env.VITE_GET_ALL_XSP || "/getAllXsp"), {
        data: {
          fields: ["ALL"],
          count_only: false,
          start: 0,
          length: 50,
          filter_param: { sxp_type: "SIP", ucc },
        },
      }),
    // BSE spells the status in either case depending on the endpoint.
    select: (res) =>
      xspItems(res).filter((i) => String(i?.status || "").toUpperCase() === "ACTIVE").length,
    enabled: Boolean(ucc),
    staleTime: 60 * 1000,
  });

  // null while unknown so the tile can stay quiet rather than claiming a confident 0.
  return { activeSipCount: isLoading || data === undefined ? null : data, isLoading };
}
