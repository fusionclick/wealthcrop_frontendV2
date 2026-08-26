import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import { Clock10Icon } from "lucide-react";
import { getApiWithToken, postApi, postApiWithToken } from "../../api/api";
import { laravelUrl, nodeUrl } from "../../utils/nodeApi";
import Combo from "../../components/ui/Combo";
import axios from "axios";

/* ===============================
   STATIC ASSET MASTER (MOCK DATA)
   =============================== */
const ASSETS = {
  stock: [
    { id: "RELIANCE", name: "Reliance Industries Ltd" },
    { id: "TCS", name: "Tata Consultancy Services" },
    { id: "INFY", name: "Infosys Ltd" },
    { id: "HDFCBANK", name: "HDFC Bank Ltd" },
  ],
  mutual_fund: [
    { id: "INF123456", name: "Axis Bluechip Fund" },
    { id: "INF654321", name: "Mirae Asset Large Cap Fund" },
    { id: "INF777888", name: "Parag Parikh Flexi Cap Fund" },
    { id: "INF999000", name: "HDFC Balanced Advantage Fund" },
  ],
};

export default function CreateBasket() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [assets, setAssets] = useState([]);

  const [type, setType] = useState("stock");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [weight, setWeight] = useState("");
  const [error, setError] = useState("")

  /* ===============================
     WEIGHT CALCULATIONS
     =============================== */
  const totalWeight = useMemo(
    () => assets.reduce((sum, a) => sum + a.weight, 0),
    [assets]
  );
  const remainingWeight = 100 - totalWeight;

  /* ===============================
     SEARCH LOGIC
     =============================== */
  // ponytail: mutual funds BSE ke master se aati hain (28k schemes, wahi endpoint jo
  // External Portfolio use karta hai). Stocks Laravel ki `assets` table se — wo abhi
  // khali hai, is liye stock search tab tak khali rahegi jab tak usay bhara na jaye.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    // 250ms debounce — har keystroke par request nahi.
    const t = setTimeout(async () => {
      if (type === "mutual_fund") {
        const res = await postApi(nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list"), {
          start: 0,
          length: 20,
          search: q,
        });
        setResults(
          (res?.data?.lists || []).map((f) => ({
            code: f.scheme_bse_code || f.scheme_isin,
            name: f.name,
            hint: f.subType,
          }))
        );
      } else {
        // encodeURIComponent zaroori hai — "L&T" jaise naam URL tod dete hain.
        const res = await getApiWithToken(
          laravelUrl(`/assets/search?query=${encodeURIComponent(q)}&type=${type}`)
        );
        setResults(
          (res?.data?.data || []).map((a) => ({
            code: a.code || String(a.id),
            name: a.name,
            hint: a.category || a.amc,
          }))
        );
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, type]);

  // Add Asset tabhi khulta hai jab naam list se match kare — free text par nahi.
  const selectedAsset = results.find((r) => r.name === query.trim());

  /* ===============================
     ADD ASSET
     =============================== */
  const addAsset = () => {
    if (!selectedAsset || !weight) return;

    const w = Number(weight);

    if (w <= 0) return;
    if (totalWeight + w > 100) {
      setError("Total allocation cannot exceed 100%");
      return;
    }

    if (assets.some((a) => a.code === selectedAsset.code)) {
      setError("Ye asset pehle se basket mein hai");
      return;
    }

    setAssets([
      ...assets,
      {
        code: selectedAsset.code,
        name: selectedAsset.name,
        asset_type: type,
        weight: w,
      },
    ]);

    setError("");
    setQuery("");
    setResults([]);
    setWeight("");
  };

  /* ===============================
     REMOVE ASSET
     =============================== */
  const removeAsset = (code) => {
    setError("")
    setAssets(assets.filter((a) => a.code !== code));
  };

  /* ===============================
     SAVE
     =============================== */
  // const saveBasket = () => {
  //   if (totalWeight !== 100) return;

  //   onSave();
   
  //   navigate("/baskets");
  // };

  const saveBasket = async () => {

    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_CREATE_BASKET}`
    const payload = {
      name,
      holdings: assets.map((item) => ({
        code: item.code,
        name: item.name,
        asset_type: item.asset_type,
        weight: item.weight,
      }))
    }
    try{  

      const res = await postApiWithToken(url, payload)
      if(res?.status === 200 || res?.status === true || res?.success === 200 || res?.success === true){
        navigate("/baskets");
        setAssets([])
        toastSuccess(res?.message)
      }

    }catch(err){
      toastError(err?.message)
    }

  }

  return (
   <div
  className="
    min-h-screen p-6
    bg-[#f3f7fb]
    dark:bg-[var(--app-bg)]
  "
>
  {/* HEADER */}
  <div className="max-w-3xl mx-auto mb-6">
    <h1
      className="
        text-3xl font-bold
        text-blue-900
        dark:text-[var(--text-primary)]
      "
    >
      Create New Basket
    </h1>

    <p
      className="
        text-sm mt-1
        text-slate-600
        dark:text-[var(--text-secondary)]
      "
    >
      Total allocation must be exactly <b>100%</b>
    </p>
  </div>

  {/* CARD */}
  <div
    className="
      bg-white max-w-3xl mx-auto p-8 rounded-2xl shadow-md
      border border-[#e0e7ef]

      dark:bg-[var(--card-bg)]
      dark:border-[var(--border-color)]
    "
  >
    {/* BASKET NAME */}
    <label
      className="
        text-sm font-medium mb-1 block
        text-slate-700
        dark:text-[var(--text-secondary)]
      "
    >
      Basket Name
    </label>

    <input
      className="
        w-full mb-5 p-3 rounded-xl
        border border-[#d4dbe5]
        bg-[#f9fbff]
        text-slate-800

        dark:bg-[var(--white-5)]
        dark:border-[var(--border-color)]
        dark:text-[var(--text-primary)]
      "
      placeholder="e.g., Long Term Wealth Basket"
      value={name}
      onChange={(e) => setName(e.target.value)}
    />

    {/* ADD ASSET ROW */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* TYPE */}
      <div>
        <label
          className="
            text-sm font-medium mb-1 block
            text-slate-700
            dark:text-[var(--text-secondary)]
          "
        >
          Asset Type
        </label>

        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setQuery("");
            setResults([]);
          }}
          className="
            w-full p-3 rounded-xl
            border border-[#d4dbe5]
            bg-[#f9fbff]

            dark:bg-[var(--white-5)]
            dark:border-[var(--border-color)]
            dark:text-[var(--text-primary)]
            dark:border-[var(--border-color)]
          "
        >
          <option value="stock">Stock</option>
          <option value="mutual_fund">Mutual Fund</option>
        </select>
      </div>

      {/* SEARCH */}
      <Combo
        id="basket-asset"
        label="Search Asset"
        value={query}
        onChange={setQuery}
        placeholder={type === "stock" ? "Search stock (e.g. Reliance)" : "Search mutual fund"}
        className="
          w-full p-3 pr-9 rounded-xl
          border border-[#d4dbe5]
          bg-[#f9fbff]

          dark:bg-[var(--white-5)]
          dark:border-[var(--border-color)]
          dark:text-[var(--text-primary)]
        "
        options={results.map((r) => ({ key: r.code, label: r.name, hint: r.hint }))}
      />

      {/* WEIGHT */}
      <div>
        <label
          className="
            text-sm font-medium mb-1 block
            text-slate-700
            dark:text-[var(--text-secondary)]
          "
        >
          Weight (%)
        </label>

        <input
          className="
            w-full p-3 rounded-xl
            border border-[#d4dbe5]
            bg-[#f9fbff]

            dark:bg-[var(--white-5)]
            dark:border-[var(--border-color)]
            dark:text-[var(--text-primary)]
          "
          placeholder={`Max ${remainingWeight}%`}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
      </div>
      {
        error && (
          <span className="text-sm text-red-600 dark:text-red-500">{error}</span>
        )
      }
    </div>

    {/* ADD BUTTON */}
    <button
      onClick={addAsset}
      disabled={!selectedAsset || !(Number(weight) > 0)}
      className={`mt-5 px-6 py-2.5 rounded-xl shadow transition ${
        selectedAsset && Number(weight) > 0
          ? "bg-blue-500 text-white hover:bg-blue-600"
          : "bg-gray-300 text-gray-500 cursor-not-allowed"
      }`}
    >
      + Add Asset
    </button>

    {/* WEIGHT STATUS */}
    <div
      className="
        mt-4 text-sm
        text-slate-600
        dark:text-[var(--text-secondary)]
      "
    >
      Allocated: <b>{totalWeight}%</b> | Remaining:{" "}
      <b
        className={
          remainingWeight === 0
            ? "text-green-600"
            : "text-blue-600"
        }
      >
        {remainingWeight}%
      </b>
    </div>

    {/* ASSET LIST */}
    <div className="mt-8">
      <h3
        className="
          text-lg font-semibold mb-3
          text-slate-800
          dark:text-[var(--text-primary)]
        "
      >
        Assets in Basket
      </h3>

      {assets.length === 0 && (
        <p
          className="
            text-sm
            text-gray-500
            dark:text-[var(--text-secondary)]
          "
        >
          No assets added yet.
        </p>
      )}

      {assets.map((a) => (
        <div
          key={a.code}
          className="
            flex justify-between items-center py-3 text-sm
            border-b

            dark:border-[var(--border-color)]
          "
        >
          <div>
            <span
              className="
                font-medium
                text-slate-800
                dark:text-[var(--text-primary)]
              "
            >
              {a.name}
            </span>

            <span
              className="
                ml-2 text-xs
                text-gray-500
                dark:text-[var(--text-secondary)]
              "
            >
              ({a.asset_type})
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-semibold text-blue-600">
              {a.weight}%
            </span>

            <button
              onClick={() => removeAsset(a.code)}
              className="text-red-500 text-xs hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>

    {/* SAVE */}
    <button
      onClick={saveBasket}
      disabled={totalWeight !== 100 || !name}
      className={`w-full mt-8 py-3 rounded-xl text-lg font-semibold transition ${
        totalWeight === 100 && name
          ? "bg-blue-500 text-white hover:bg-blue-600"
          : "bg-gray-300 text-gray-500 cursor-not-allowed"
      }`}
    >
      Save Basket
    </button>
  </div>
</div>

  );
}
