// Premium, long-form KYC flow (Groww-style)
// ✔ Compact steps + ✔ Left gradient illustration + ✔ Dark mode polish
// ✔ State management for all steps + ✔ Final API submit

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import {
  CheckCircle,
  Upload,
  FileText,
  Video,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { BarChart3, Loader2 } from "lucide-react";
import { getApiWithToken, postApiWithToken } from "../../api/api";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import { useQuery } from "@tanstack/react-query";
import {banks} from "../../utils/bank"
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/authenticationSlice";
import { nodeUrl, laravelUrl } from "../../utils/nodeApi";
import { validateKycStep } from "../../utils/FormSchema";
import { KYC_DEMO } from "../../utils/kycDemoData";
import { verdictFrom, verdictFromUccStatus, isKycVerified, reviewCopy, BSE_UNREACHABLE, VERIFIED_VERDICT } from "../../utils/kycVerdict";

const steps = ["Personal", "Bank", "Docs", "Nominee", "Review"];

export default function KYCFlow() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [stepError, setStepError] = useState("");
  // field -> message; ek saath saari galtiyan dikhti hain, ek-ek karke nahi
  const [fieldErrors, setFieldErrors] = useState({});
  const [completedSteps, setCompletedSteps] = useState({});
  const [userStep, setUserStep] = useState()
const [loadingStep, setLoadingStep] = useState(false);
const [isUccCreated, setIsUccCreated] = useState(false)
const uccRequested = useRef(false)
const [uccResponseData, setUccResponseData] = useState()
const [customBank, setCustomBank] = useState("");
// BSE's verdict on the UCC, as relayed by Laravel (kyc/ucc_add or kyc/bse-status)
const [bseVerdict, setBseVerdict] = useState(null);
const [checkingBse, setCheckingBse] = useState(false);
const bseChecked = useRef(false);
// add_ucc ho gaya par Laravel ka ucc_add fail — UCC kahin store nahi hui. Ise yaad
// rakho, warna reload par wahi PAN par doosri UCC ban jati hai (USRWC003/004/005 wala bug).
const pendingUcc = useRef(null);
// add_ucc fail ho jaye to page ko hamesha ke liye spinner par mat chhodo
const [uccError, setUccError] = useState("");
const [retryTick, setRetryTick] = useState(0);

const navigate = useNavigate()
const dispatch = useDispatch()


const current = JSON.parse(localStorage.getItem("currentAccount"))
const userName = current?.name
const email = current?.email

const [docUploaded, setDocUploaded] = useState({
  pan: false,
  aadhaar: false,
  selfie: false
});

  const fetchUser = async () => {
    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_USER_DATA}`;
    const res = await getApiWithToken(url);
  
    if (!(res?.status === 200 || res?.status === true)) {
      throw new Error(res?.message || "Failed to fetch");
    }
  
    console.log("User Data", res?.data);
    
    return res.data?.data;
  };
  
  
  const { data: userData, isLoading, error, refetch } = useQuery({
    queryKey: ["userData"],
    queryFn: fetchUser,
  });

//! this is to check user kyc step and redirect diretly to that step
    useEffect(() => {

      const currentStep = userData?.kyc_steps
      if(!currentStep) return

      setStep(currentStep < 4 ? currentStep + 1 : currentStep);
      setUserStep(currentStep +1 )

      setCompletedSteps((prev) => {
        const updated = {...prev}
        
        for (let i = 0; i <= (currentStep < 4 ? currentStep : currentStep - 1); i++) {
         updated[i] = true;
      }
        return updated
      })

      console.log("KYC Step", userData?.kyc_steps);
      
    },[userData])

    const {data} = useQuery({
      queryKey: ["ucc"],
      queryFn: fetchUser
    })


  //  CENTRAL KYC STATE
  const [kycData, setKycData] = useState({
    pan: "",
    // aadhar aur fName yahan the hi nahi — dono inputs uncontrolled chal rahe the
    aadhar: "",
    fName: "",
    dob: "",
    name: "",
    gender: "",
    mStatus: "",
    addrss1: "",
    addrss2: "",
    // addrss3: "",
    occupation: "",
    income: "",
    city: "",
    state: "",
    pin: "",
    bankName: "",
    accountNo: "",
    ifsc: "",
    nomineeName: "",
    nomineeRelation: "",
    nomineePercentage: "",
    documentA: null,
    documentP: null,
    // video: null,
  });

  // pan Image,
  // add line 1, 2, 3
  // pin code,
  // marital status,
  // fathers name

  const update = (key, value) =>
    setKycData((prev) => ({ ...prev, [key]: value }));

//   const handlePrimaryAction = () => {
//   const error = validateStep(step, kycData);
//   if (error) {
//     setStepError(error);
//     return;
//   }

//   setStepError("");

//   if (step < 4) {
//     setStep(step + 1);
//   } else {
//     submitKYC();
//   }
// };

const handlePrimaryAction = async () => {
  const errors = validateKycStep(step, kycData);
  if (Object.keys(errors).length) {
    setFieldErrors(errors);
    setStepError("Please fix the highlighted fields.");
    return;
  }

  setFieldErrors({});
  setStepError("");

  try {
    setLoadingStep(true);

    const res = await callStepApi(step, kycData); //  get response

    //  check API success properly
    if (res?.status === true || res?.status === 200) {
      
      //  mark step success (green)
      setCompletedSteps((prev) => ({
        ...prev,
        [step]: true,
      }));

      //  move to next step
      if (step < 4) {
        setStep(step + 1);
      } else {
        submitKYC();
      }

    } else {
      //  API responded but failed
      setStepError(res?.message || "Something went wrong");
    }

  } catch (e) {
    // network / server error
    setStepError("API failed. Try again.");
  } finally {
    setLoadingStep(false);
  }
};




//! api url
const stepApiConfig = {
  // 0: {
  //   url: "/api/kyc/pan",
  //   getPayload: (data) => ({
  //     pan: data.pan,
  //     dob: data.dob,
  //   }),
  // },
  0: {
    url: `${import.meta.env.VITE_URL}/kyc/profile`,
    getPayload: (data) => ({
      // name: data.name,
      pan_number: data.pan,
      aadhaar_number: data.aadhar,
      dob: data.dob,
      gender: data.gender,
      occupation: data.occupation,
      marital_status: data.mStatus?.toLowerCase(),
      fName: data.fName,
      address_line1: data.addrss1,
      address_line2: data.addrss2,
      income: Number(data.income),
      city: data.city,
      state: data.state,
      pincode: data.pin,
    }),
  },
  1: {
     url: `${import.meta.env.VITE_URL}/kyc/bank`,
    getPayload: (data) => ({
      bank_name: data.bankName,
      account_holder_name: data.name,
      account_number: data.accountNo,
      ifsc_code: data.ifsc,
    }),
  },
  2: {
     url: `${import.meta.env.VITE_URL}/kyc/document`,
    getPayload: (data) => ({
      type: "aadhaar",
      file: data.document,
    }),
  },
  3: {
     url: `${import.meta.env.VITE_URL}/kyc/nominee`,
    getPayload: (data) => ({
      name: data.nomineeName,
      relation: data.nomineeRelation,
      percentage: data.nomineePercentage,
    }),
  },
  4: {
     url: `${import.meta.env.VITE_URL}/kyc/document`,
    getPayload: (data) => ({
      type: "video",
      file: data.video,
    }),
  },
};

const callStepApi = async (step, data) => {
  const config = stepApiConfig[step];
  if (!config) return true;

  const payload = config.getPayload(data);

  const res = await postApiWithToken(config.url, payload);

  if (res?.status === 200 || res?.status === true) {
    toastSuccess(res?.message);
  }

  return res;
};

//! For document only
const uploadDocument = async (type, file) => {
  try {
    const formData = new FormData();
    formData.append("type", type);
    formData.append("file", file);

    const res = await fetch(`${import.meta.env.VITE_URL}/kyc/document`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();

    if (data?.status === true || data?.status === 200) {
      toastSuccess(data?.message);

      // mark individual doc uploaded
      setDocUploaded((prev) => ({
        ...prev,
        [type]: true,
      }));

      return data;
    } else {
      toastError(data?.message || "Upload failed");
    }
  } catch (err) {
    toastError(err?.message)
    console.error(err);
    return null;
  }
};

useEffect(() => {
  //  replace 3 with your actual Docs step index
  if ((step === 2 && docUploaded.pan && docUploaded.aadhaar) || (step === 4 && docUploaded.selfie)) {
    
    //  mark step green
    setCompletedSteps((prev) => ({
      ...prev,
      [step]: true,
    }));

    //  move next
    setStep((prev) => prev + 1);
  }
}, [docUploaded, step]);

//! to fetch first name and last name
const getNameParts = (fullName = "") => {
  const parts = fullName.trim().split(" ").filter(Boolean);

  return {
    first_name: parts[0] || "",
    last_name: parts.slice(1).join(" ") || "", // handles middle names too
  };
};

  //  FINAL SUBMIT
  const submitKYC = async () => {
    setSubmitting(true);
    try {
      // Replace with real API
      await new Promise((r) => setTimeout(r, 2000));
      console.log("KYC SUBMITTED", kycData);
      setStep(4);
    } catch (e) {
      toastError("KYC submission failed");
    } finally {
      setSubmitting(false);
    }


  };

  //! Generate Client Code
  const generateClientCode = (name = "") => {

    const prefix = name.replace(/\s+/g, "").toUpperCase().slice(0, 3) || "USR"
    const timeStamp = Date.now().toString().slice(-4)
    const random = Math.floor(100 + Math.random() * 900);
    return `${prefix}${timeStamp}${random}`
  }


useEffect(() => {
  if (step !== 4) return; // only run on step 5

    //! To send kyc step
  const sendStep = async () => {
    const url = `${import.meta.env.VITE_URL}/kyc/steps`
    try {
      const res = await postApiWithToken(url, {step})
      if(res?.status === 200 || res?.status === true){
        toastSuccess("Step send successfully")
        console.log("Step", step);
        
      }
    } catch (error) {
      toastError(error?.message)
    }
  }

  sendStep()

}, [step]);

useEffect(() => {
  if (step !== 4 || !userData) return;
  // ponytail: UCC ek hi dafa banni chahiye. Ye effect `userData` par dobara chalta hai
  // (react-query har refetch par naya object deta hai) aur har run BSE par ek aur UCC
  // bhej deta tha — usi PAN par teen ban chuki hain (USRWC003/004/005) aur har baar
  // verification zero par reset ho jati thi, is liye transaction_ready kabhi TRUE nahi
  // hui. Pehle se UCC hai to haath mat lagao; warna is session mein sirf ek koshish.
  if (userData?.kyc?.ucc_code) {
    setIsUccCreated(true);
    return;
  }
  if (uccRequested.current) return;
  uccRequested.current = true;

  const createUCC = async () => {

    const generate10Digit = () =>
      Math.floor(10000000 + Math.random() * 90000000);

    const dp_id = userData?.kyc?.dp_id || generate10Digit();
    const client_id = userData?.kyc?.client_id || generate10Digit();

    console.log(dp_id);
    console.log(client_id);
    
    try {
      console.log("userData", userData);

      const addressLine1 = userData?.profile?.address_line1 || "";
      const pincode = userData?.profile?.pincode || "";

      // T1.5 — Validate address line1 minimum 8 chars before hitting BSE
      if (addressLine1.trim().length < 8) {
        toastError("Address line 1 must be at least 8 characters. Please update your profile.");
        return;
      }

      // T1.6 — Validate pincode is a valid 6-digit India postal code
      const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
      if (!PINCODE_REGEX.test(pincode)) {
        toastError("Invalid pincode. Please enter a valid 6-digit India pincode.");
        return;
      }

      const payload = {
        client_code: generateClientCode(userData?.name),
        first_name: userData?.name,
        middle_name: "",
        last_name: "",
        dob: userData?.profile?.dob,
        email: email,
        pan: userData?.profile?.pan_number,
        dp_id: String(dp_id),
        client_id: String(client_id),
        place_of_birth: userData?.profile?.city || "India",

        address: {
          line1: addressLine1,
          line2: userData?.profile?.address_line2,
          line3: userData?.profile?.state,
          pincode: pincode,
        },

        bank: {
          ifsc: userData?.bank_accounts?.[0]?.ifsc_code,
          acc_no: userData?.bank_accounts?.[0]?.account_number || "123456789012",
          acc_type: userData?.bank_accounts?.[0]?.account_type || "SB",
        },
      };
      console.log("UCC Payload", payload);

      const uccUrl = nodeUrl(import.meta.env.VITE_ADD_UCC || "/v2/add_ucc");
      // ponytail: bearer lazmi hai — Node ka requireInvestor bina token 401 deta hai. Pehle
      // yahan bare axios tha, is liye BSE step UI se kabhi chala hi nahi. silent: neeche ka
      // catch khud BSE ki field-wise galtiyan toast karta hai.
      const res = await postApiWithToken(uccUrl, payload, { silent: true, throwOnError: true });

      console.log("UCC response", res);
      if (res?.data?.client_code || res?.status === "success") {
        setIsUccCreated(true);
        setUccError("");
        const clientCode = res?.data?.client_code || payload.client_code;
        // BSE ka faisla isi jawab mein hai (demo par APPROVED), to foran dikhao — Laravel ka
        // sync peechhe chalta rahega aur authoritative status DB mein likhega.
        const immediate = verdictFromUccStatus(res?.data?.status);
        if (immediate) setBseVerdict(immediate);
        // ponytail: 2-minute UCC status poll hata diya — verdict Laravel ke bse-status sync se
        // aata hai, aur pending par "Check again" hai. Poll sirf pending path ko 2 minute rokta tha.
        // Laravel asks BSE (via Node) and writes kyc_status itself — the browser never decides.
        pendingUcc.current = { ucc: clientCode, dp_id, client_id };
        const synced = await sendUcc(clientCode, dp_id, client_id);
        if (isKycVerified(synced?.kyc_status)) {
          // mandate sirf verified UCC par — PENDING_VERIFICATION par BSE ise reject karta hai
          mandateCreation(clientCode);
          toastSuccess("KYC verified by BSE. Please sign in to continue.");
          finishKyc();
        }
      }
    } catch (error) {
      const bseErrors = error.response?.data?.errors;
      if (bseErrors?.length) {
        bseErrors.forEach(e => toastError(e.message));
      } else {
        toastError(error.response?.data?.error || error.message || "UCC registration failed");
      }
      console.error("UCC Error:", error.response?.data || error.message);
      // Spinner sirf tab tak jab tak request chal rahi hai. Fail par error + retry.
      setUccError(
        bseErrors?.map((e) => e.message).join("; ") ||
          error.response?.data?.error ||
          error.message ||
          "Could not register your UCC with BSE."
      );
      setIsUccCreated(true);
    }
  };

  createUCC();
}, [step, userData, retryTick]);

// "Try again" — UCC banane ki koshish dobara. Ref reset kiye bina effect skip kar deta hai.
const retryUcc = () => {
  uccRequested.current = false;
  setUccError("");
  setIsUccCreated(false);
  setBseVerdict(null);
  setRetryTick((n) => n + 1);
};


            const mandateCreation = async (ucc) => {
            
              const payload = {
                data: {
                  member: "91010",
                  investor: {
                    ucc,
                  },
                  mem_details: {
                    euin: "E234123",
                    sub_br_arn: "ARN-873456",
                    sub_br_code: "",
                  },
                  // mem_mandate_info: {
                  // member_mandate_id: "MM123456789",
                  // mandate_status_date: "2024-02-12T10:30:00Z",
                  // umrn_number: "UMRN987654321",
                  // utility_code: "UTL000123",
                  // sponsor_code: "SPN456789"
                  // },
                  investor_bank_details: {
                    ifsc: userData?.bank_accounts?.[0]?.ifsc_code,
                    no: userData?.bank_accounts?.[0]?.account_number || "123456789012",
                    type: "CB",
                    name: userData?.bank_accounts?.[0]?.bank_name,
                    branch: "BHARUCH",
                    // ifsc: "SBIN0011856",
                    //   no: "40584578524",
                    //   type: "SB",
                    //   name: "State Bank of India",
                    //   branch: "BHARUCH",
                    vpa: ["tanmoy@sbi"],
                  },
                  amount: 15000,
                  start_date: "2026-07-08",
                  valid_till: "2035-11-19",
                  reg_date: "2026-06-11",
                  type: "U",
                  redirect_url: "",
                  mode: "DD",
                  frequency: "AS AND WHEN PRESENTED",
                  request_type: "REGISTRATION",
                },
              };


            const url = nodeUrl(import.meta.env.VITE_MANDATE_REGISTRATION || "/mandate_register/upi-autopay");
            try {

              const res = await postApiWithToken(url, payload)

              console.log("mandate creation response", res);
              

              // if(res?.status === 200 || res?.status === true){
              //   toastSuccess(res?.message)
              // }
              
            } catch (error) {
              console.log(error?.message);
              
            }
          }

  // Laravel stores the UCC, asks BSE for the verdict and answers { kyc_status, bse }.
  const sendUcc = async (ucc, dp_id, client_id) => {
  const url= `${import.meta.env.VITE_URL}/kyc/ucc_add`
  setCheckingBse(true);
  try {

    const res = await postApiWithToken(url,  {
      "ucc_code": ucc,
      dp_id,
      client_id
    },)

    console.log("Ucc send response", res);


    if(res?.status === 200 || res?.status === true){
      pendingUcc.current = null; // Laravel ke paas UCC hai — ab bse-status kaafi hai
      toastSuccess(res?.message)
      setBseVerdict(verdictFrom(res));
    } else {
      setBseVerdict(BSE_UNREACHABLE);
    }
    return res;

  } catch (error) {
    console.log(error?.message);
    setBseVerdict(BSE_UNREACHABLE);

  } finally {
    setCheckingBse(false);
  }
}

useEffect(() => {
// sendUcc()
},[])

// Signup journey ends here. The flow is signup -> otp -> kyc -> login -> dashboard, so
// hand over to /login instead of dropping the user straight on the dashboard.
const finishKyc = () => {
  localStorage.removeItem("pin_expiry");
  dispatch(logout());
  navigate("/login", { replace: true });
};

// "Check again": Laravel re-asks BSE (via Node) and rewrites kyc_status itself.
const checkBseStatus = async () => {
  // UCC ban chuki hai par Laravel tak nahi pahunchi: bse-status 422 dega, is liye
  // pehle ucc_add dobara — warna UCC orphan reh jati hai aur reload duplicate banata hai.
  if (pendingUcc.current) {
    const { ucc, dp_id, client_id } = pendingUcc.current;
    const retried = await sendUcc(ucc, dp_id, client_id);
    if (isKycVerified(retried?.kyc_status)) {
      mandateCreation(ucc);
      toastSuccess("KYC verified by BSE. Please sign in to continue.");
      finishKyc();
    }
    return;
  }
  setCheckingBse(true);
  try {
    const res = await getApiWithToken(`${import.meta.env.VITE_URL}/kyc/bse-status`);
    const body = res?.data;
    if (!(body?.status === 200 || body?.status === true)) {
      setBseVerdict(BSE_UNREACHABLE);
      return;
    }
    setBseVerdict(verdictFrom(body));
    if (isKycVerified(body.kyc_status)) {
      toastSuccess("KYC verified by BSE. Please sign in to continue.");
      finishKyc();
    }
  } finally {
    setCheckingBse(false);
  }
};

// Existing UCC on the Review step: ask BSE once on load; the button repeats it.
useEffect(() => {
  if (step !== 4 || !userData?.kyc?.ucc_code || bseChecked.current) return;
  bseChecked.current = true;
  if (isKycVerified(userData.kyc.kyc_status)) {
    setBseVerdict(VERIFIED_VERDICT);
    return;
  }
  checkBseStatus();
}, [step, userData]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#020617] flex flex-col items-center px-4 py-4">
      {/* TOP INFO */}
      <div className="max-w-5xl w-full mb-5 text-center">
        <h1 className="text-2xl md:text-3xl font-semibold text-blue-950 dark:text-white">
          Complete your KYC
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          One-time secure verification to start investing
        </p>
      </div>

      {/* MAIN CARD */}
      <div className="w-full max-w-5xl flex-1 grid grid-cols-1 md:grid-cols-3 bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl overflow-hidden">
        {/* LEFT PANEL */}
        <div className="hidden md:flex flex-col col-span-1 justify-between p-6 bg-gradient-to-br from-blue-950 to-indigo-900 text-white no-glass">
          <div>
            <h2 className="text-xl font-semibold mb-2">Why KYC?</h2>
            <p className="text-sm text-blue-100">
              Required by SEBI to keep your investments safe.
            </p>
          </div>

          <div className="space-y-4 mt-6">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  // className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  //   i <= step ? "bg-white text-blue-950" : "bg-white/30"
                  // }`}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
  completedSteps[i]
    ? "bg-green-500 text-white"
    : i === step
    ? "bg-white text-blue-950"
    : "bg-white/30"
}`}
                >
                  {/* {i < step ? "✓" : i + 1} */}
                  {completedSteps[i] ? "✓" : i + 1}
                </div>
                <span
                  className={`text-sm ${
                    i === step ? "font-medium" : "opacity-70"
                  }`}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>

          <div className="text-xs text-blue-200 space-y-2 mt-2">
            <p className="flex items-center gap-2">
              <ShieldCheck size={14} /> SEBI compliant
            </p>
            <p className="flex items-center gap-2">
              <Lock size={14} /> Bank-grade encryption
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="p-5 md:p-6 col-span-2">
          {/* Mobile step bar */}
          <div className="flex md:hidden mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 mx-0.5 rounded ${
                  i <= step ? "bg-blue-900" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* ponytail: Review AnimatePresence ke bahar hai. `mode="wait"` naya step tab tak
              mount nahi karta jab tak purane ka exit poora na ho, aur is screen par UCC ka
              jawab usi waqt state badalta hai — exit beech mein ruk jata tha aur panel
              khali reh jata tha. Ye aakhri screen hai, isay animation par depend nahi karna. */}
          {step === 4 ? (
            <ReviewStep isUccCreated={isUccCreated} verdict={bseVerdict} checking={checkingBse} onCheck={checkBseStatus} onFinish={finishKyc} error={uccError} onRetry={retryUcc} />
          ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {/* {step === 0 && <PANStep data={kycData} onChange={update} />} */}
              {step === 0 && <PersonalStep data={kycData} onChange={update} errors={fieldErrors} />}
              {step === 1 && <BankStep data={kycData} onChange={update} errors={fieldErrors} customBank={customBank} setCustomBank={setCustomBank} setKycData={setKycData} />}
              {step === 2 && <DocsStep data={kycData} onChange={update} errors={fieldErrors} uploadDocument={uploadDocument} />}
              {step === 3 && <NomineeStep data={kycData} onChange={update} errors={fieldErrors} />}
            </motion.div>
          </AnimatePresence>
          )}

       {/* FOOTER */}
{step < 4 && (
  <div className="mt-6">
    {stepError && (
      <p className="mb-3 text-sm text-red-600 dark:text-red-500">
        {stepError}
      </p>
    )}

    <div className="flex justify-between">
      <div className="flex gap-2">
      <button
        disabled={step === 0 || step <= userStep}
        onClick={() => {
          setStepError("");
          setStep(step - 1);
        }}
        className="
          text-sm px-4 py-2 rounded-lg
          border border-gray-300 dark:border-white/10
          text-gray-700 dark:text-gray-300
          bg-white dark:bg-transparent
          hover:bg-gray-100 dark:hover:bg-white/5
          disabled:opacity-40 disabled:cursor-not-allowed
          transition
        "
      >
        Back
      </button>
      {/* ponytail: tester shortcut — literal import.meta.env.DEV so Vite folds it to false in
          production; VITE_KYC_DEMO_FILL=1 switches it on for a staging build. Current step only. */}
      {(import.meta.env.DEV || import.meta.env.VITE_KYC_DEMO_FILL === "1") && KYC_DEMO[step] && (
        <button
          type="button"
          onClick={() => {
            setKycData((prev) => ({ ...prev, ...KYC_DEMO[step] }));
            setFieldErrors({});
            setStepError("");
          }}
          className="text-sm px-4 py-2 rounded-lg border border-dashed border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition"
        >
          Fill BSE demo data
        </button>
      )}
      </div>

      {step < 4 ? (
        // <button
        //   onClick={handlePrimaryAction}
        //   className="text-sm px-5 py-2 rounded-lg bg-blue-950 text-white hover:bg-blue-900"
        // >
        //   Continue
        // </button>
        <button
  onClick={handlePrimaryAction}
  disabled={loadingStep || step === 4}
  className={`
  text-sm px-5 py-2 rounded-lg
  bg-blue-950 text-white
  hover:bg-blue-900
  disabled:bg-gray-400
  disabled:cursor-not-allowed
`}
>
  {loadingStep ? "Saving..." : "Continue"}
</button>
      ) : (
        <button
          onClick={handlePrimaryAction}
          disabled={submitting}
          className="text-sm px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
        >
          {submitting ? "Submitting..." : "Submit KYC"}
        </button>
      )}
    </div>
  </div>
)}

        </div>
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */
// ponytail: "required" wahi hai jo kycStepSchemas sach me rokta hai — label aur
// validation ek hi list se chalein, warna dono alag-alag jhoot bolne lagte hain.
function FieldLabel({ label, required, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
      {label}{" "}
      {required ? (
        <span className="text-red-500" aria-hidden="true">*</span>
      ) : (
        <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
      )}
    </label>
  );
}

// ponytail: format browser ko sambhalne do — type="date" picker deta hai aur
// "202222222" jaisa kachra type hi nahi hone deta. digitsOnly/upper sirf wahan
// jahan native type kaafi nahi (PAN, IFSC, Aadhaar).
function Field({
  label, value, onChange, placeholder, required, error,
  type = "text", maxLength, inputMode, digitsOnly, upper, ...rest
}) {
  const id = `kyc-${label.replace(/\W+/g, "-").toLowerCase()}`;
  const handle = (raw) => {
    let v = raw;
    if (digitsOnly) v = v.replace(/\D/g, "");
    if (upper) v = v.toUpperCase();
    if (maxLength) v = v.slice(0, maxLength);
    onChange(v);
  };
  return (
    <div>
      <FieldLabel label={label} required={required} htmlFor={id} />
      <input
        id={id}
        type={type}
        value={value ?? ""}
        onChange={(e) => handle(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        aria-required={Boolean(required)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
        {...rest}
        className={`
    w-full px-3 py-2 rounded-lg border
    bg-white dark:bg-[#0b1220]
    text-sm text-gray-900 dark:text-white
    placeholder-gray-400 dark:placeholder-gray-500
    outline-none focus:ring-1
    ${error
      ? "border-red-500 focus:ring-red-500"
      : "border-gray-300 dark:border-white/10 focus:ring-blue-800"}
  `}
      />
      <FieldError id={`${id}-err`} message={error} />
    </div>
  );
}

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

function FieldSelect({label, value, onChange, options, required, error}) {
  const id = `kyc-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div>
      <FieldLabel label={label} required={required} htmlFor={id} />

      <select 
      id={id}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      aria-required={Boolean(required)}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-err` : undefined}
      className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-[#0b1220]
      text-sm text-gray-900 dark:text-white outline-none focus:ring-1
      ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-white/10 focus:ring-blue-800"}`}
      >
        <option value="" disabled>Select {label}</option>
        {
          options.map((opt) => {
            const { value: v, label: l } =
              typeof opt === "string" ? { value: opt, label: opt.toUpperCase() } : opt;
            return <option key={v} value={v}>{l}</option>;
          })
        }
      </select>
      <FieldError id={`${id}-err`} message={error} />
    </div>
  )
}


export const BankSelect = ({
  label = "Bank Name",
  options = [],
  value,
  onChange,
  required,
}) => {
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: "42px",
      borderRadius: "8px",
      border: "1px solid #d1d5db",
      backgroundColor: "#ffffff",
      boxShadow: state.isFocused
        ? "0 0 0 1px #1e40af"
        : "none",
      outline: "none",
      fontSize: "14px",
      cursor: "pointer",

      "&:hover": {
        border: "1px solid #d1d5db",
      },
    }),

    valueContainer: (provided) => ({
      ...provided,
      padding: "0 12px",
    }),

    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
      fontSize: "14px",
    }),

    singleValue: (provided) => ({
      ...provided,
      color: "#111827",
      fontSize: "14px",
    }),

    menu: (provided) => ({
      ...provided,
      borderRadius: "10px",
      overflow: "hidden",
      marginTop: "4px",
      border: "1px solid #e5e7eb",
      boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
      zIndex: 9999,
    }),

    menuList: (provided) => ({
      ...provided,
      maxHeight: "220px",
      padding: "4px",
      backgroundColor: "#ffffff",
    }),

    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#1e40af"
        : state.isFocused
        ? "#eff6ff"
        : "#ffffff",

      color: state.isSelected ? "#ffffff" : "#111827",
      padding: "10px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
    }),

    indicatorSeparator: () => ({
      display: "none",
    }),

    dropdownIndicator: (provided) => ({
      ...provided,
      color: "#6b7280",

      "&:hover": {
        color: "#111827",
      },
    }),
  };

  return (
    <div>
      <FieldLabel label={label} required={required} />

      <Select
        options={options.map((bank) => ({
          value: bank.name,
          label: bank.name.toUpperCase(),
        }))}
        value={
          value
            ? {
                value,
                label: value.toUpperCase(),
              }
            : null
        }
        onChange={(selected) => onChange(selected?.value)}
        placeholder={`Select ${label}`}
        styles={customStyles}
        isSearchable
      />
    </div>
  );
};

function PANStep({ data, onChange }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold dark:text-white">
        PAN Verification
      </h2>
      <Field
        label="PAN Number"
        required
        value={data.pan}
        onChange={(v) => onChange("pan", v.toUpperCase())}
        placeholder="ABCDE1234F"
      />
      <Field
        label="Date of Birth"
        required
        value={data.dob}
        onChange={(v) => onChange("dob", v)}
        placeholder="DD/MM/YYYY"
      />
    </div>
  );
}

function NomineeStep({ data, onChange, errors = {} }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold dark:text-white">
        Add Nominee
      </h2>
      <Field
        label="Nominee Name"
          required
        value={data.nomineeName}
          error={errors.nomineeName}
        onChange={(v) => onChange("nomineeName", v.toUpperCase())}
        placeholder="Nominee Name"
      />
      <Field
        label="Relation with Nominee"
          required
        value={data.nomineeRelation}
          error={errors.nomineeRelation}
        onChange={(v) => onChange("nomineeRelation", v)}
        placeholder="Relation with nominee"
      />
      <Field
        label="Percentage you want to give"
          required
        value={data.nomineePercentage}
          error={errors.nomineePercentage}
          digitsOnly
          maxLength={3}
          inputMode="numeric"
        onChange={(v) => onChange("nomineePercentage", v)}
        placeholder="50%"
      />
    </div>
  );
}

function PersonalStep({ data, onChange, errors = {} }) {
  return (
    <div className="space-y-3 p-1">
      <h2 className="text-lg font-semibold dark:text-white">
        Personal Details
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
        <Field
          label="Full Name"
          required
          value={data.name}
          error={errors.name}
          onChange={(v) => onChange("name", v)}
          placeholder="As per PAN"
        />
         <Field
        label="PAN Number"
        required
        value={data.pan}
        error={errors.pan}
        upper
        maxLength={10}
        onChange={(v) => onChange("pan", v.toUpperCase())}
        placeholder="ABCDE1234F"
      />
         <Field
        label="Aadhar Number"
          required
        value={data.aadhar}
          error={errors.aadhar}
          digitsOnly
          maxLength={12}
          inputMode="numeric"
        onChange={(v) => onChange("aadhar", v.toUpperCase())}
        placeholder="9722 0589 0456"
      />
      <Field
        label="Date of Birth"
        required
        value={data.dob}
        error={errors.dob}
        type="date"
        max={new Date().toISOString().slice(0, 10)}
        onChange={(v) => onChange("dob", v)}
        placeholder="YYYY/MM/DD"
      />
        <FieldSelect
          label="Gender"
          required
          value={data.gender}
          error={errors.gender}
          onChange={(v) => onChange("gender", v)}
          options={["male", "female", "other"]}
        />
        <FieldSelect
          label="Occupation"
          required
          value={data.occupation}
          error={errors.occupation}
          onChange={(v) => onChange("occupation", v)}
          placeholder="Salaried"
          options={[  "student",
  "employed",
  "self-employed",
  "freelancer",
  "unemployed",
  "business owner",
  "government employee",
  "private sector employee",
  "homemaker",
  "retired",
  "intern",
  "other"]}
        />
        <FieldSelect
          label="Marital Status"
          value={data.mStatus}
          error={errors.mStatus}
          onChange={(v) => onChange("mStatus", v)}
          placeholder="Married"
          options={["Married", "Single"]}
        />
        <Field
          label="Father's Name"
          value={data.fName}
          error={errors.fName}
          onChange={(v) => onChange("fName", v)}
          placeholder="As per documents"
        />
        <Field
          label="Address Line 1"
          required
          value={data.addrss1}
          error={errors.addrss1}
          onChange={(v) => onChange("addrss1", v)}
          placeholder="Address Line 1"
        />
        <Field
          label="Address Line 2"
          value={data.addrss2}
          error={errors.addrss2}
          onChange={(v) => onChange("addrss2", v)}
          placeholder="Address Line 2"
        />
        {/* <Field
          label="Address Line 3"
          value={data.addrss3}
          onChange={(v) => onChange("addrss3", v)}
          placeholder="Address Line 3"
        /> */}
        <FieldSelect
          label="Income"
          required
          value={data.income}
          error={errors.income}
          onChange={(v) => onChange("income", v)}
          placeholder="₹5–10 L"
          options={[
            { value: "10000", label: "Below ₹10,000" },
            { value: "25000", label: "₹10,000 – ₹25,000" },
            { value: "50000", label: "₹25,000 – ₹50,000" },
            { value: "100000", label: "₹50,000 – ₹1,00,000" },
            { value: "200000", label: "₹1,00,000 – ₹2,00,000" },
            { value: "500000", label: "₹2,00,000 – ₹5,00,000" },
            { value: "1000000", label: "Above ₹5,00,000" },
          ]}
        />
        <Field
          label="City"
          required
          value={data.city}
          error={errors.city}
          onChange={(v) => onChange("city", v)}
          placeholder="Mumbai"
        />
        <Field
          label="State"
          value={data.state}
          error={errors.state}
          onChange={(v) => onChange("state", v)}
          placeholder="West Bengal"
        />
        <Field
          label="Pin"
          required
          value={data.pin}
          error={errors.pin}
            digitsOnly
            maxLength={6}
            inputMode="numeric"
          onChange={(v) => onChange("pin", v)}
          placeholder="123654"
        />
      </div>
    </div>
  );
}

function BankStep({ data, onChange, errors = {}, customBank, setCustomBank, setKycData }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold dark:text-white">Bank Details</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
        <BankSelect
          label="Bank name"
          value={data.bankName}
          onChange={(value) =>
    setKycData((prev) => ({
      ...prev,
      bankName: value,
    }))
  }
          placeholder="Bank of India"
          options={banks}
        />

        {
  data.bankName === "OTHER" && (
    <div className="mt-5">
      <input
        type="text"
        placeholder="Enter Your Bank Name"
        value={customBank}
        onChange={(e) => {
          const value = e.target.value;

          setCustomBank(value);

          setKycData((prev) => ({
            ...prev,
            bankName: value,
          }));
        }}
        className="
          w-full px-3 py-2 rounded-lg
          border border-gray-300
          bg-white text-sm
          outline-none
          focus:ring-1 focus:ring-blue-800
        "
      />
    </div>
  )
}

        <Field
          label="Account No"
          required
          value={data.accountNo}
          error={errors.accountNo}
            digitsOnly
            maxLength={18}
            inputMode="numeric"
          onChange={(v) => onChange("accountNo", v)}
          placeholder="XXXXXXXX"
        />
        <Field
          label="IFSC"
          required
          value={data.ifsc}
          error={errors.ifsc}
            upper
            maxLength={11}
          onChange={(v) => onChange("ifsc", v)}
          placeholder="SBIN0000"
        />
      </div>
    </div>
  );
}

function DocsStep({ data, onChange, errors = {}, uploadDocument }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold dark:text-white">Documents</h2>
      <label
        className="
      flex items-center justify-between gap-3 border border-dashed rounded-xl p-4 cursor-pointer border-gray-300
      dark:border-white/10 bg-gray-50 dark:bg-white/5 hove:bg-gray-100 dark:hover:bg-white/10 transition
      "
      >
        <div className="flex items-center gap-3 dark:text-white">
          <FileText size={20} />
          <div>
            <p className="text-sm font-medium ">Upload PAN <span className="text-red-500" aria-hidden="true">*</span></p>
            {data.documentP && (
              <p className="text-xs text-green-600">{data.documentP.name}</p>
            )}
            {errors.documentP && (
              <p role="alert" className="text-xs text-red-600">{errors.documentP}</p>
            )}
          </div>
        </div>
        <Upload size={18} className="dark:text-white" />
<input
  type="file"
  className="hidden"
  onChange={async (e) => {
    const file = e.target.files[0];
    onChange("documentP", file);

    if (file) {
      await uploadDocument("pan", file);
    }
  }}
/>
      </label>
      <label
        className="
      flex items-center justify-between gap-3 border border-dashed rounded-xl p-4 cursor-pointer border-gray-300
      dark:border-white/10 bg-gray-50 dark:bg-white/5 hove:bg-gray-100 dark:hover:bg-white/10 transition
      "
      >
        <div className="flex items-center gap-3 dark:text-white">
          <FileText size={20} />
          <div>
            <p className="text-sm font-medium ">Upload Aadhaar <span className="text-red-500" aria-hidden="true">*</span></p>
            {data.documentA && (
              <p className="text-xs text-green-600">{data.documentA.name}</p>
            )}
            {errors.documentA && (
              <p role="alert" className="text-xs text-red-600">{errors.documentA}</p>
            )}
          </div>
        </div>
        <Upload size={18} className="dark:text-white" />
<input
  type="file"
  className="hidden"
  onChange={async (e) => {
    const file = e.target.files[0];
    onChange("documentA", file);

    if (file) {
      await uploadDocument("aadhaar", file);
    }
  }}
/>
      </label>
    </div>
  );
}

function VideoKYCStep({ data, onChange, uploadDocument }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold dark:text-white">Video KYC</h2>
      <label
        className="flex items-center justify-between gap-3 border rounded-xl p-4 cursor-pointer dark:text-white
      border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10
      "
      >
        <div className="flex items-center gap-3">
          <Video size={20} />
          <div>
            <p className="text-sm font-medium">Selfie Video (5–10 sec)</p>
            {data.video && (
              <p className="text-xs text-green-600">{data.video.name}</p>
            )}
          </div>
        </div>
        <Upload size={18} />
        <input
          type="file"
          accept="video/*"
          className="hidden"
           onChange={async (e) => {
    const file = e.target.files[0];
      const MAX_SIZE = 45 * 1024 * 1024; // 5MB

    if (file.size > MAX_SIZE) {
      toastError("Video must be less than 5MB");
      return;
    }
    onChange("video", file);

    if (file) {
      await uploadDocument("selfie", file);
    }
  }}
        />

      </label>
      {data.video && (
              <p className="text-xs text-red-600">Please wait, your video is uploading...</p>
            )}
    </div>
  );
}

function ReviewStep({ isUccCreated, verdict, checking, onCheck, onFinish, error, onRetry }) {
  const { heading, detail, verified, canRecheck } = reviewCopy(verdict, checking);
  return (
    <>

          {error ? (
     <div className="text-center space-y-3 flex items-center flex-col justify-center h-80">
      <div className="bg-red-100 text-red-600 p-4 rounded-full dark:bg-red-500/15 dark:text-red-400">
        <FileText size={28} />
      </div>
      <h2 className="text-lg font-semibold dark:text-white">We could not submit your KYC</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md" role="alert">{error}</p>
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={onRetry}
          className="bg-blue-950 dark:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 dark:hover:bg-blue-500 transition"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition"
        >
          Continue to sign in
        </button>
      </div>
    </div>
          ) : !isUccCreated ? (
       <div className="flex flex-col items-center justify-center animate-pulse h-80">
  <div
    className="
      bg-blue-100 text-blue-600 p-4 rounded-full mb-4
      dark:bg-blue-500/15 dark:text-blue-400
    "
  >
    <Loader2 className="animate-spin" size={40} />
  </div>

  <h2
    className="
      text-xl md:text-2xl font-semibold mb-2
      text-blue-950
      dark:text-[var(--text-primary)]
    "
  >
    Your KYC is being submitted.
  </h2>

  <p
    className="
      text-gray-600 text-sm md:text-base text-center
      dark:text-[var(--text-secondary)]
    "
  >
    Please do not leave this page while your KYC is being submitted.
  </p>

  {/* Fake progress bar */}
  <div
    className="
      w-64 h-2 rounded-full mt-6 overflow-hidden
      bg-gray-200
      dark:bg-[var(--white-5)]
    "
  >
    <div
      className="
        h-full bg-blue-600
        dark:bg-blue-500
        animate-[progress_3s_ease-in-out_infinite]
      "
    />
  </div>

  {/* Keyframes */}
  <style>
    {`
      @keyframes progress {
        0% { width: 0%; }
        50% { width: 90%; }
        100% { width: 0%; }
      }
    `}
  </style>
</div>

      ) : (
     <div className="text-center space-y-3 flex items-center flex-col justify-center h-80">
      <CheckCircle size={36} className={`mx-auto ${verified ? "text-green-600" : "text-amber-500"}`} />
      <h2 className="text-lg font-semibold dark:text-white">{heading}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md" role="status">
        {detail}
      </p>
      {verdict?.ucc_status && (
        <p className="text-xs text-gray-400 dark:text-gray-500">BSE UCC status: {verdict.ucc_status}</p>
      )}
      <div className="flex gap-2 mt-2">
        {canRecheck && (
          <button
            type="button"
            onClick={onCheck}
            disabled={checking}
            className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {checking ? "Checking…" : "Check again"}
          </button>
        )}
        {/* Fallback: the verified path already hands over, but an existing UCC short-circuits it. */}
        <button
          onClick={onFinish}
          className="bg-blue-950 dark:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 dark:hover:bg-blue-500 transition"
        >
          Continue to sign in
        </button>
      </div>
    </div>

      )}

  
    </>
  );
}


function KYCVerificationLoder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 dark:bg-[var(--app-bg)] p-6">
      {loading ? (
       <div className="flex flex-col items-center justify-center animate-pulse">
  <div
    className="
      bg-blue-100 text-blue-600 p-4 rounded-full mb-4
      dark:bg-blue-500/15 dark:text-blue-400
    "
  >
    <Loader2 className="animate-spin" size={40} />
  </div>

  <h2
    className="
      text-xl md:text-2xl font-semibold mb-2
      text-blue-950
      dark:text-[var(--text-primary)]
    "
  >
    Generating Reports
  </h2>

  <p
    className="
      text-gray-600 text-sm md:text-base text-center
      dark:text-[var(--text-secondary)]
    "
  >
    Please wait while we fetch your investment insights...
  </p>

  {/* Fake progress bar */}
  <div
    className="
      w-64 h-2 rounded-full mt-6 overflow-hidden
      bg-gray-200
      dark:bg-[var(--white-5)]
    "
  >
    <div
      className="
        h-full bg-blue-600
        dark:bg-blue-500
        animate-[progress_3s_ease-in-out_infinite]
      "
    />
  </div>

  {/* Keyframes */}
  <style>
    {`
      @keyframes progress {
        0% { width: 0%; }
        50% { width: 90%; }
        100% { width: 0%; }
      }
    `}
  </style>
</div>

      ) : (
      <div className="flex flex-col items-center justify-center text-center">
  <div
    className="
      bg-blue-100 text-blue-600 p-4 rounded-full mb-4
      dark:bg-blue-500/15 dark:text-blue-400
    "
  >
    <BarChart3 size={40} />
  </div>

  <h2
    className="
      text-2xl font-semibold mb-2
      text-blue-950
      dark:text-[var(--text-primary)]
    "
  >
    No Reports Available
  </h2>

  <p
    className="
      text-gray-600 text-sm md:text-base mb-5 max-w-md
      dark:text-[var(--text-secondary)]
    "
  >
    You haven’t generated any reports yet. Once you start investing,
    detailed performance insights will appear here.
  </p>

  <button
    onClick={() => navigate("/user/stocks/explore")}
    className="
      bg-blue-600 hover:bg-blue-700 text-white
      dark:bg-blue-500 dark:hover:bg-blue-600
      px-5 py-2 rounded-lg text-sm font-medium transition
    "
  >
    Explore Investments
  </button>
</div>

      )}
    </div>
  )
}