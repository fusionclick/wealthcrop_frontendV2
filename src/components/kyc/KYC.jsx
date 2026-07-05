// Premium, long-form KYC flow (Groww-style)
// ✔ Compact steps + ✔ Left gradient illustration + ✔ Dark mode polish
// ✔ State management for all steps + ✔ Final API submit

import { useEffect, useState } from "react";
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
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {banks} from "../../utils/bank"
import { useNavigate } from "react-router-dom";
import { nodeUrl, laravelUrl } from "../../utils/nodeApi";

const steps = ["Personal", "Bank", "Docs", "Nominee", "Review"];

export default function KYCFlow() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [stepError, setStepError] = useState("");
  const [completedSteps, setCompletedSteps] = useState({});
  const [userStep, setUserStep] = useState()
const [loadingStep, setLoadingStep] = useState(false);
const [isUccCreated, setIsUccCreated] = useState(false)
const [uccResponseData, setUccResponseData] = useState()
const [customBank, setCustomBank] = useState("");

const navigate = useNavigate()


const current = JSON.parse(localStorage.getItem("currentAccount"))
const userName = current?.name
const email = current?.email
const phone = current?.phone

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
  const error = validateStep(step, kycData);
  if (error) {
    setStepError(error);
    return;
  }

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


  const validateStep = (step, data) => {
  switch (step) {
    // case 0: // PAN
    //   if (!data.pan) return "PAN is required";
    //   if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(data.pan))
    //     return "Invalid PAN format";
    //   if (!data.dob) return "Date of birth is required";
    //   return null;

    case 0: // Personal
      if (!data.name.trim()) return "Name is required";
      if (!data.pan) return "PAN is required";
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(data.pan))
        return "Invalid PAN format";
     if (!data.dob) return "Date of birth is required";
if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dob)) {
  return "Date must be in YYYY-MM-DD format (e.g. 2020-10-02)";
}
      if (!data.occupation) return "Occupation is required";
      if (!data.income) return "Income is required";
      if (!data.gender) return "Gender is required";
      if (!data.addrss1) return "Address 1 is required";
      if (data.addrss1.trim().length < 8) return "Address line 1 must be at least 8 characters";
      if (!data.addrss2) return "Address 2 is required";
      if (!data.pin) return "Pin is required";
      if (!/^[1-9][0-9]{5}$/.test(String(data.pin))) return "Enter a valid 6-digit India pincode";
      if (!data.aadhar) return "Income is required";
      if (!data.city) return "City is required";
      return null;

    case 1: // Bank
      if (!data.accountNo) return "Account number is required";
      if (!/^\d{9,18}$/.test(data.accountNo))
        return "Invalid account number";
      if (!data.ifsc) return "IFSC is required";
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifsc))
        return "Invalid IFSC code";
      return null;

 case 2: // Docs
  if (!data.documentP || !data.documentA) {
    return "Upload both PAN and Aadhaar";
  }
  return null;

    case 3: // Nominee
      if (!data.nomineeName) return "Please enter nominee name";
      if (!data.nomineeRelation) return "Please enter relation with nominee";
      if (!data.nomineePercentage) return "Please enter percentage";
      return null;

   case 4:
    if(!data.video) return "Please upload your selfie video"   

    default:
      return null;
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
        mobile: phone,
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
      const res = await axios.post(uccUrl, payload, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("UCC response", res);
      if (res?.data?.data?.client_code || res?.data?.status === "success") {
        setIsUccCreated(true);
        const clientCode = res?.data?.data?.client_code || payload.client_code;
        const uccStatus = res?.data?.data?.status || "APPROVED";
        console.log("Client code after ucc add", clientCode, uccStatus);

        // Poll UCC status until APPROVED (max 2 min)
        if (uccStatus !== "APPROVED") {
          const pollUrl = nodeUrl("/getparticularucc");
          for (let i = 0; i < 12; i++) {
            await new Promise((r) => setTimeout(r, 10000));
            try {
              const poll = await axios.post(pollUrl, { data: { client_code: clientCode } });
              const st = poll?.data?.response?.data?.status || poll?.data?.data?.status;
              if (st === "APPROVED") break;
            } catch (_) { /* continue polling */ }
          }
        }

        sendUcc(clientCode, dp_id, client_id);
        mandateCreation(clientCode);
        toastSuccess("UCC registered successfully!");
        navigate("/");
      }
    } catch (error) {
      const bseErrors = error.response?.data?.errors;
      if (bseErrors?.length) {
        bseErrors.forEach(e => toastError(e.message));
      } else {
        toastError(error.response?.data?.error || error.message || "UCC registration failed");
      }
      console.error("UCC Error:", error.response?.data || error.message);
    }
  };

  createUCC();
}, [step, userData]);


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

  const sendUcc = async (ucc, dp_id, client_id) => {
  const url= `${import.meta.env.VITE_URL}/kyc/ucc_add`
  try {

    const res = await postApiWithToken(url,  {
      "ucc_code": ucc,
      dp_id,
      client_id
    },)

    console.log("Ucc send response", res);
    

    if(res?.status === 200 || res?.status === true){
      toastSuccess(res?.message)
    }
    
  } catch (error) {
    console.log(error?.message);
    
  }
}

useEffect(() => {
// sendUcc()
},[])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#020617] flex flex-col items-center px-4 py-10">
      {/* TOP INFO */}
      <div className="max-w-5xl w-full mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-semibold text-blue-950 dark:text-white">
          Complete your KYC
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          One-time secure verification to start investing
        </p>
      </div>

      {/* MAIN CARD */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl overflow-hidden">
        {/* LEFT PANEL */}
        <div className="hidden md:flex flex-col col-span-1 justify-between p-8 bg-gradient-to-br from-blue-950 to-indigo-900 text-white">
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
        <div className="p-6 md:p-8 col-span-2">
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

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {/* {step === 0 && <PANStep data={kycData} onChange={update} />} */}
              {step === 0 && <PersonalStep data={kycData} onChange={update} />}
              {step === 1 && <BankStep data={kycData} onChange={update} customBank={customBank} setCustomBank={setCustomBank} setKycData={setKycData} />}
              {step === 2 && <DocsStep data={kycData} onChange={update} uploadDocument={uploadDocument} />}
              {step === 3 && <NomineeStep data={kycData} onChange={update} />}
              {/* {step === 4 && <VideoKYCStep data={kycData} onChange={update} uploadDocument={uploadDocument} />} */}
              {step === 4 && <ReviewStep isUccCreated={isUccCreated} />}
            </motion.div>
          </AnimatePresence>

       {/* FOOTER */}
{step < 4 && (
  <div className="mt-6">
    {stepError && (
      <p className="mb-3 text-sm text-red-600 dark:text-red-500">
        {stepError}
      </p>
    )}

    <div className="flex justify-between">
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

      {/* BOTTOM TRUST SECTION */}
      <div className="max-w-5xl w-full mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <TrustCard title="Secure" desc="256-bit encrypted data" />
        <TrustCard title="Fast" desc="KYC in under 5 minutes" />
        <TrustCard title="Trusted" desc="Used by 1M+ investors" />
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */
function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
    w-full px-3 py-2 rounded-lg border
    border-gray-300 dark:border-white/10
    bg-white dark:bg-[#0b1220]
    text-sm text-gray-900 dark:text-white
    placeholder-gray-400 dark:placeholder-gray-500
    focus:ring-1 focus:ring-blue-800 outline-none
  "
      />
    </div>
  );
}

function FieldSelect({label, value, onChange, options}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1" >
        {label}
      </label>

      <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0b1220]
      text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-800 outline-none"
      >
        <option value="" disabled>Select {label}</option>
        {
          options.map((opt) => (
            <option key={opt} value={opt}>
              {opt.toUpperCase()}
            </option>
          ))
        }
      </select>
    </div>
  )
}


export const BankSelect = ({
  label = "Bank Name",
  options = [],
  value,
  onChange,
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
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
        {label}
      </label>

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
        value={data.pan}
        onChange={(v) => onChange("pan", v.toUpperCase())}
        placeholder="ABCDE1234F"
      />
      <Field
        label="Date of Birth"
        value={data.dob}
        onChange={(v) => onChange("dob", v)}
        placeholder="DD/MM/YYYY"
      />
    </div>
  );
}

function NomineeStep({ data, onChange }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold dark:text-white">
        Add Nominee
      </h2>
      <Field
        label="Nominee Name"
        value={data.nomineeName}
        onChange={(v) => onChange("nomineeName", v.toUpperCase())}
        placeholder="Nominee Name"
      />
      <Field
        label="Relation with Nominee"
        value={data.nomineeRelation}
        onChange={(v) => onChange("nomineeRelation", v)}
        placeholder="Relation with nominee"
      />
      <Field
        label="Percentage you want to give"
        value={data.nomineePercentage}
        onChange={(v) => onChange("nomineePercentage", v)}
        placeholder="50%"
      />
    </div>
  );
}

function PersonalStep({ data, onChange }) {
  return (
    <div className="space-y-4 h-[400px] overflow-y-auto p-2">
      <h2 className="text-lg font-semibold dark:text-white">
        Personal Details
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field
          label="Full Name"
          value={data.name}
          onChange={(v) => onChange("name", v)}
          placeholder="As per PAN"
        />
         <Field
        label="PAN Number"
        value={data.pan}
        onChange={(v) => onChange("pan", v.toUpperCase())}
        placeholder="ABCDE1234F"
      />
         <Field
        label="Aadhar Number"
        value={data.aadhar}
        onChange={(v) => onChange("aadhar", v.toUpperCase())}
        placeholder="9722 0589 0456"
      />
      <Field
        label="Date of Birth"
        value={data.dob}
        onChange={(v) => onChange("dob", v)}
        placeholder="YYYY/MM/DD"
      />
        <FieldSelect
          label="Gender"
          value={data.gender}
          onChange={(v) => onChange("gender", v)}
          options={["male", "female", "other"]}
        />
        <FieldSelect
          label="Occupation"
          value={data.occupation}
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
          onChange={(v) => onChange("mStatus", v)}
          placeholder="Married"
          options={["Married", "Single"]}
        />
        <Field
          label="Father's Name"
          value={data.fName}
          onChange={(v) => onChange("fName", v)}
          placeholder="As per documents"
        />
        <Field
          label="Address Line 1"
          value={data.addrss1}
          onChange={(v) => onChange("addrss1", v)}
          placeholder="Address Line 1"
        />
        <Field
          label="Address Line 2"
          value={data.addrss2}
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
          value={data.income}
          onChange={(v) => onChange("income", v)}
          placeholder="₹5–10 L"
          options={["below 10,000",
  "10,000 - 25,000",
  "25,000 - 50,000",
  "50,000 - 1,00,000",
  "1,00,000 - 2,00,000",
  "2,00,000 - 5,00,000",
  "above 5,00,000"]}
        />
        <Field
          label="City"
          value={data.city}
          onChange={(v) => onChange("city", v)}
          placeholder="Mumbai"
        />
        <Field
          label="State"
          value={data.state}
          onChange={(v) => onChange("state", v)}
          placeholder="West Bengal"
        />
        <Field
          label="Pin"
          value={data.pin}
          onChange={(v) => onChange("pin", v)}
          placeholder="123654"
        />
      </div>
    </div>
  );
}

function BankStep({ data, onChange, customBank, setCustomBank, setKycData }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold dark:text-white">Bank Details</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          value={data.accountNo}
          onChange={(v) => onChange("accountNo", v)}
          placeholder="XXXXXXXX"
        />
        <Field
          label="IFSC"
          value={data.ifsc}
          onChange={(v) => onChange("ifsc", v)}
          placeholder="SBIN0000"
        />
      </div>
    </div>
  );
}

function DocsStep({ data, onChange, uploadDocument }) {
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
            <p className="text-sm font-medium ">Upload PAN</p>
            {data.documentP && (
              <p className="text-xs text-green-600">{data.documentP.name}</p>
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
            <p className="text-sm font-medium ">Upload Aadhaar</p>
            {data.documentA && (
              <p className="text-xs text-green-600">{data.documentA.name}</p>
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

function ReviewStep({isUccCreated}) {
  return (
    <>

          {!isUccCreated ? (
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
      <CheckCircle size={36} className="mx-auto text-green-600" />
      <h2 className="text-lg font-semibold dark:text-white">KYC Submitted</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        We’ll notify you once approved.
      </p>
    </div>

      )}

  
    </>
  );
}

function TrustCard({ title, desc }) {
  return (
    <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 rounded-xl p-4">
      <h4 className="font-medium text-blue-950 dark:text-white">{title}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{desc}</p>
    </div>
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