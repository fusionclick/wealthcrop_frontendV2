import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import { Clock10Icon } from "lucide-react";
import { getApiWithToken, postApiWithToken } from "../../api/api";
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
  const [selectedAsset, setSelectedAsset] = useState(null);
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
     SEARCH LOGIC (STATIC)
     =============================== */
  // const searchAssets = (text) => {
  //   setQuery(text);
  //   setSelectedAsset(null);

  //   if (text.length < 2) {
  //     setResults([]);
  //     return;
  //   }

  //   const matches = ASSETS[type]
  //     .filter((a) =>
  //       a.name.toLowerCase().includes(text.toLowerCase())
  //     )
  //     .slice(0, 4); // show max 4 results

  //   setResults(matches);
  // };
  const searchAssets = async (text) => {
    setQuery(text);
    setSelectedAsset(null);

    if (text.length < 2) {
      setResults([]);
      return;
    }

    const url = `${import.meta.env.VITE_URL}/assets/search?query=${text}&type=${type}`
    const res = await getApiWithToken(url)

    if(res?.status === 200 || res?.status === true){

      setResults(res?.data?.data)
      console.log("basket search assests ", res);
    }
    

    // const matches = ASSETS[type]
    //   .filter((a) =>
    //     a.name.toLowerCase().includes(text.toLowerCase())
    //   )
    //   .slice(0, 4); // show max 4 results

    // setResults(matches);
  };

  useEffect(() => {
console.log("Search results", results);

  },[results])

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

    setAssets([
      ...assets,
      {
        id: selectedAsset.id,
        asset_id: selectedAsset.id,
        name: selectedAsset.name,
        asset_type: type,
        weight: w,
      },
    ]);

    setQuery("");
    setResults([]);
    setSelectedAsset(null);
    setWeight("");
  };

  /* ===============================
     REMOVE ASSET
     =============================== */
  const removeAsset = (id) => {
    setError("")
    setAssets(assets.filter((a) => a.id !== id));
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
        asset_id: item.asset_id,
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
      <div className="relative">
        <label
          className="
            text-sm font-medium mb-1 block
            text-slate-700
            dark:text-[var(--text-secondary)]
          "
        >
          Search Asset
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
          placeholder={
            type === "stock"
              ? "Search stock (e.g. Reliance)"
              : "Search mutual fund"
          }
          value={query}
          onChange={(e) => searchAssets(e.target.value)}
        />

        {results.length > 0 && (
          <div
            className="
              absolute z-10 w-full mt-1 rounded-xl shadow overflow-hidden md:w-[460px] overflow-y-auto
              bg-white border border-[#e0e7ef] h-54

              dark:bg-[var(--card-bg)]
              dark:border-[var(--border-color)]
            "
          >
            {results.map((asset) => (
              <div
                key={asset.id}
                onClick={() => {
                  setSelectedAsset(asset);
                  setQuery(asset.name);
                  setResults([]);
                }}
                className="
                  px-4 py-2 text-sm cursor-pointer
                  hover:bg-blue-50

                  dark:hover:bg-blue-500/15
                  dark:text-[var(--text-primary)]
                "
              >
                {asset.name}
              </div>
            ))}
          </div>
        )}
      </div>

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
      disabled={!selectedAsset || weight === 0}
      className={`mt-5 px-6 py-2.5 rounded-xl shadow transition ${
        selectedAsset && weight > 0
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
          key={a.id}
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
              onClick={() => removeAsset(a.id)}
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
