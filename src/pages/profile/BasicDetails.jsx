import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux"; 
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaAngleRight } from "react-icons/fa6";
import { FiEdit2 } from "react-icons/fi";
import { TfiAngleRight } from "react-icons/tfi";
import { FaArrowLeftLong } from "react-icons/fa6";
import {
  IndianRupee,
  FileText,
  Headphones,
  BarChart3,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  User,
  KeyRound,
  Activity,
  Users,
  Phone,
} from "lucide-react";  
import { getApiWithToken, postApiWithToken } from "../../api/api";
import { toastError, toastSuccess, toastWarn } from "../../utils/notifyCustom";
import { formatDate } from "../../utils/format";


const BasicDetails = () => {

    const navigate = useNavigate()

    const [openModal, setOpenModal] = useState(false);
    const [editType, setEditType] = useState(null);
      const [mobileVerify, setMobileVerify] = useState(false)
      const [emailVerify, setEmailVerify] = useState(false)
      // const [userData, setUserData] = useState(null)




const handleBack = () => {
  navigate(-1); // Go to previous route
};

    // ---------------- STATIC DATA ----------------
  const riskProfile = {
    isSet: true, // 🔁 change to false to test NOT SET state
    category: "Moderate",
    equityLimit: "50%",
    debtLimit: "40%",
    goldLimit: "10%",
    lastUpdated: "12 Jan 2025",
  };

const fetchUser = async () => {
  const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_USER_DATA}`;
  const res = await getApiWithToken(url);

  if (!(res?.status === 200 || res?.status === true)) {
    throw new Error(res?.message || "Failed to fetch");
  }

  console.log("User Data", res?.data);
  
  return res?.data?.data;
};


const { data: userData, isLoading, error, refetch } = useQuery({
  queryKey: ["userData"],
  queryFn: fetchUser,
});

  const accounts = JSON.parse(localStorage.getItem("accounts")) || []
// const visibleAcounts = showAll ? accounts : accounts.slice(0,2)
const current = JSON.parse(localStorage.getItem("currentAccount"))
const userName = current?.name
const email = current?.email
const phone = current?.phone

const isKycDone = userData?.kyc_status === "true"
// const isKycDone = true

  const handleVerify = async (type) => {

    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_VERIFY}`

    try {
      const response = await postApiWithToken(url, {type} )
      console.log("Verify", response);
      
      if(response?.status === 200 || response?.status){
        setEditType(type === "email" ? "emailVerify" : "phoneVerify");
        setOpenModal(true);
        toastSuccess(response?.message);
      }else{
        // toastError(res?.message || "Something went wrong");  
      }
    } catch (error) {
      toastError(error.message)
    }

  }
  const handleVerifyOTP = async (type, value) => {

    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_VERIFY_SEND_OTP}`
    const id = type === "phoneVerify" ? "phone" : "email"
    try {
      const response = await postApiWithToken(url, {type: id, otp: value} )
      console.log("Verify otp", response);
      
        if(response?.status === 200 || response?.status){
          id === "email" ? setEmailVerify(true) : setMobileVerify(true)
          refetch()
          setOpenModal(false);
          toastSuccess(response?.message);
        }else{
        // toastError(res?.message || "Something went wrong");  
      }
    } catch (error) {
      toastError(error.message)
    }

  }

  const handleChangeDetails = async (type, value) => {

    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_UPDATE_MOB_EMAIL}`
    const id = type === "mobile" ? "phone" : type
    try {
      const response = await postApiWithToken(url, {[id]: value} )
      console.log("Verify otp", response);
      
      if(response?.status === 200 || response?.status){
        // id === "email" ? setEmailVerify(true) : setMobileVerify(true)
        refetch()
        if(id === "email"){
          current.email = value
        }else if(id === "phone"){
          current.phone = value
        }

        const updatedAccounts = accounts.map( acc => acc.userId === current.userId ? current : acc)

          localStorage.setItem("currentAccount", JSON.stringify(current));
          localStorage.setItem("accounts", JSON.stringify(updatedAccounts));

        setOpenModal(false);
        toastSuccess(response?.message);
      }else{
        // toastError(res?.message || "Something went wrong");  
      }
    } catch (error) {
      toastError(error.message)
    }

  }

  const redirectRiskProfile = () => {

      const isReUpdate = userData?.risk_profile?.updated_at < Date.now() 
      if(!isReUpdate) return toastWarn(`You can update after ${formatDate(userData?.risk_profile?.next_allowed_at)} `)

    navigate("/risk")
  }


  return (
    <>
    
    <div className="w-full border hidden lg:block border-gray-300 dark:border-slate-700 rounded-lg ">
              {/* Basic Details */}
                <div className="w-full bg-white dark:bg-slate-900 rounded-md  ">
                  {/* Header */}
                  <div className="w-full flex items-center justify-between px-6 py-6 border-b border-gray-200 dark:border-slate-700 ">
                   <div>
                     <h2 className="text-blue-950 dark:text-[var(--text-primary)] text-xl font-semibold">
                      Personal Details
                    </h2>
                    <span className="text-sm text-gray-600 dark:text-[var(--text-secondary)] font-semibold">
                      PAN - {userData?.pan || "EMUZX1234G" }
                    </span>
                   </div>

                    <button
      onClick={!isKycDone ? () => navigate("/kyc") : undefined}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition
        ${
          isKycDone
            ? "bg-green-100 text-green-700 cursor-default"
            : "bg-yellow-500 hover:bg-yellow-600 text-white"
        }`}
    >
      {isKycDone ? (
        <>
          <ShieldCheck className="fill-green-600 text-white" size={18} />
          KYC Verified
        </>
      ) : (
        "Complete KYC"
      )}
    </button>

                  </div>
    
                  {/* Details */}
                  <div className="px-6 py-4 space-y-6">
                    {/* Full Name */}
                    <div>
                      <p className="text-gray-500 text-sm dark:text-[var(--text-primary)]">Full Name</p>
                      <p className="text-blue-950 font-semibold dark:text-[var(--text-secondary)]">{userData?.name ?? "--"}</p>
                    </div>
    
                    {/* Date of Birth */}
                    <div>
                      <p className="text-gray-500 text-sm dark:text-[var(--text-primary)]">Date of Birth</p>
                      <p className="text-blue-950 font-semibold dark:text-[var(--text-secondary)]">{userData?.dob ?? "--"}</p>
                    </div>
    
                    {/* Mobile Number */}
                    <div className="flex justify-between items-center">
                     
                        <div>
                          <p className="text-gray-500 text-sm dark:text-[var(--text-primary)]">Mobile Number</p>
                           <div className="flex gap-2 items-center">
                        <p className="text-blue-950 font-semibold dark:text-[var(--text-secondary)]">{userData?.phone ?? "--"}</p>
                        <button  
                        onClick={() => {
         handleVerify("phone")
        }} 
        className={userData?.is_phone_verified
 ? "text-xs font-semibold text-white rounded-md" : "text-xs flex  font-semibold bg-yellow-500 hover:bg-yellow-600 text-white px-2 rounded-md h-4.5"}> { userData?.is_phone_verified ? (
<ShieldCheck className="fill-green-600" size={20} /> ) :
"Verify"
        } </button>
                        </div>
                        
                        
                      </div>

                      <button 
                        onClick={() => {
                           setEditType("mobile");
          setOpenModal(true);
                        }}
                      className="text-emerald-600 hover:text-emerald-800">
                        <FiEdit2 />
                      </button>
                    </div>
    
                    {/* Email Address */}
                    <div className="flex justify-between items-center">                      
                        <div>
                        <p className="text-gray-500 text-sm dark:text-[var(--text-primary)]">Email Address</p>


                      <div className="flex gap-2 items-center">
                        <p className="text-blue-950 font-semibold dark:text-[var(--text-secondary)]">{userData?.email}</p>
                        <button  
                        onClick={() => {
         handleVerify("email")
        }} 
        className={userData?.is_email_verified ? "text-xs font-semibold text-white rounded-md" : "text-xs flex  font-semibold bg-yellow-500 hover:bg-yellow-600 text-white px-2 rounded-md h-4.5"}> { userData?.is_email_verified ? (
<ShieldCheck className="fill-green-600" size={20} /> ) :
"Verify"
        } </button>
                        </div>
        </div>

                      <button 
                      onClick={() => {
                        setEditType("email")
                        setOpenModal(true)
                      }}
                      className="text-emerald-600 hover:text-emerald-800">
                        <FiEdit2 />
                      </button>
                    </div>
    
                    {/* Marital Status */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-500 text-sm dark:text-[var(--text-primary)]">Marital Status</p>
                        <p className="text-blue-950 font-semibold dark:text-[var(--text-secondary)]">-</p>
                      </div>
                      <button 
                      onClick={() => {
                        setEditType("maritalStatus")
                        setOpenModal(true)
                      }}
                      className="text-emerald-600 hover:text-emerald-800">
                        <FiEdit2 />
                      </button>
                    </div>
    
                    {/* Gender */}
                    <div>
                      <p className="text-gray-500 text-sm dark:text-[var(--text-primary)]">Gender</p>
                      <p className="text-blue-950 font-semibold dark:text-[var(--text-secondary)]">-</p>
                    </div>

                    {/* Unique Client ID */}
      <div
        className="
          flex justify-between items-center
        "
      >
        <div>
          <p className="text-gray-500 text-sm dark:text-[var(--text-secondary)]">
            Unique Client Code
          </p>
          <p className="text-blue-950 font-semibold dark:text-[var(--text-primary)]">
            1254789658
          </p>
        </div>

        {/* <button
          className="
            text-emerald-600 hover:text-emerald-800
            dark:text-emerald-400 dark:hover:text-emerald-300
          "
        >
          <FiEdit2 />
        </button> */}
      </div>
    
                    {/* Income Range */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-500 text-sm dark:text-[var(--text-primary)]">Income Range</p>
                        <p className="text-blue-950 font-semibold dark:text-[var(--text-secondary)]">-</p>
                      </div>
                      <button 
                      onClick={() => {
                        setEditType("income")
                        setOpenModal(true)
                      }}
                      className="text-emerald-600 hover:text-emerald-800">
                        <FiEdit2 />
                      </button>
                    </div>
    
                    {/* Occupation */}
                    <div>
                      <p className="text-gray-500 text-sm dark:text-[var(--text-primary)]">Occupation</p>
                      <p className="text-blue-950 font-semibold dark:text-[var(--text-secondary)]">-</p>
                    </div>
    
                    {/* Father’s Name */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-500 text-sm dark:text-[var(--text-primary)]">Father's Name</p>
                        <p className="text-blue-950 font-semibold dark:text-[var(--text-secondary)]">-</p>
                      </div>
                      <button 
                      onClick={() => {
                        setEditType("father'sName")
                        setOpenModal(true)
                      }}
                      className="text-emerald-600 hover:text-emerald-800">
                        <FiEdit2 />
                      </button>
                    </div>
    
                    {/* Address */}
                    <div>
                      <p className="text-gray-500 text-sm dark:text-[var(--text-primary)]">Address</p>
                      <p className="text-blue-950 font-semibold dark:text-[var(--text-secondary)]">-</p>
                    </div>
                  </div>
                </div>
                    {openModal && (
  <EditModal
  handleVerifyOTP={handleVerifyOTP}
  handleChangeDetails={handleChangeDetails}
    type={editType}
    onClose={() => setOpenModal(false)}
  />
)}
            </div>


    {/* Less than lg view */}
 <div
  className="
    fixed inset-0 z-9999 overflow-y-auto lg:hidden
    bg-white
    dark:bg-[var(--app-bg)]
  "
>
  {/* Basic Details */}
  <div className="w-full h-full flex flex-col">

    {/* Header Row */}
    <div
      className="
        flex px-6 border-b
        border-gray-200
        dark:border-[var(--border-color)]
      "
    >
      <button
        className="
          p-2 rounded-full transition
          hover:bg-gray-100
          dark:hover:bg-[var(--white-5)]
        "
      >
        <FaArrowLeftLong
          onClick={handleBack}
          className="
            w-5 h-5
            text-gray-700
            dark:text-[var(--text-primary)]
          "
        />
      </button>

      {/* Header */}
      <div className="w-full px-6 py-6 flex justify-between items-center">
      <div>
          <h2
          className="
            text-xl font-semibold
            text-blue-950
            dark:text-[var(--text-primary)]
          "
        >
          Personal Details
        </h2>

        <span
          className="
            text-sm font-semibold
            text-gray-600
            dark:text-[var(--text-secondary)]
          "
        >
          PAN - {userData?.pan || "EMUZX1234G"} 
        </span>
      </div>

                 <button
      onClick={!isKycDone ? () => navigate("/kyc") : undefined}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition
        ${
          isKycDone
            ? "bg-green-100 text-green-700 cursor-default"
            : "bg-yellow-500 hover:bg-yellow-600 text-white"
        }`}
    >
      {isKycDone ? (
        <>
          <ShieldCheck className="fill-green-600 text-white" size={18} />
          KYC Verified
        </>
      ) : (
        "Complete KYC"
      )}
    </button>

      </div>
    </div>

    {/* Details */}
    <div className="px-6 py-4 space-y-6 flex-1 overflow-y-auto">

      {/* Full Name */}
      <div
        className="
          border-b border-gray-300
          dark:border-[var(--border-color)]
        "
      >
        <p className="text-gray-500 text-sm dark:text-[var(--text-secondary)]">
          Name (as on PAN Card)
        </p>
        <p className="text-blue-950 font-semibold dark:text-[var(--text-primary)]">
          {userData?.name ?? "--"}
        </p>
      </div>

      {/* Date of Birth */}
      <div
        className="
          border-b border-gray-300
          dark:border-[var(--border-color)]
        "
      >
        <p className="text-gray-500 text-sm dark:text-[var(--text-secondary)]">
          Date of Birth
        </p>
        <p className="text-blue-950 font-semibold dark:text-[var(--text-primary)]">
          {userData?.dob ?? "--"}
        </p>
      </div>

      {/* Mobile Number */}
      {/* <div
        className="
          flex justify-between items-center
          border-b border-gray-300
          dark:border-[var(--border-color)]
        "
      >
        <div>
          <p className="text-gray-500 text-sm dark:text-[var(--text-secondary)]">
            Mobile Number
          </p>
          <p className="text-blue-950 font-semibold dark:text-[var(--text-primary)]">
            {userData?.phone ?? "--"}
          </p>
        </div>

        <button 
        onClick={() => {
          setEditType("mobile");
          setOpenModal(true);
        }}
          className="
            text-emerald-600 hover:text-emerald-800
            dark:text-emerald-400 dark:hover:text-emerald-300
          "
        >
          <FiEdit2 />
        </button>
      </div> */}

      {/* Email Address */}
      {/* <div
        className="
          flex justify-between items-center
          border-b border-gray-300
          dark:border-[var(--border-color)]
        "
      >
        <div>
          <p className="text-gray-500 text-sm dark:text-[var(--text-secondary)]">
            Email Address
          </p>
          <p className="text-blue-950 font-semibold dark:text-[var(--text-primary)]">
            {userData?.r}
          </p>
        </div>

        <button
          className="
            text-emerald-600 hover:text-emerald-800
            dark:text-emerald-400 dark:hover:text-emerald-300
          "
        >
          <FiEdit2 />
        </button>
      </div> */}

        {/* Mobile Number */}
                    <div className="flex justify-between items-center  border-b border-gray-300
          dark:border-[var(--border-color)]">
                     
                        <div>
                          <p className="text-gray-500 text-sm dark:text-[var(--text-primary)]">Mobile Number</p>
                           <div className="flex gap-2 items-center">
                        <p className="text-blue-950 font-semibold dark:text-[var(--text-secondary)]">{userData?.phone ?? "--"}</p>
                        <button  
                        onClick={() => {
         handleVerify("phone")
        }} 
        className={userData?.is_phone_verified
 ? "text-xs font-semibold text-white rounded-md" : "text-xs flex  font-semibold bg-yellow-500 hover:bg-yellow-600 text-white px-2 rounded-md h-4.5"}> { userData?.is_phone_verified ? (
<ShieldCheck className="fill-green-600" size={20} /> ) :
"Verify"
        } </button>
                        </div>
                        
                        
                      </div>

                      <button 
                        onClick={() => {
                           setEditType("mobile");
          setOpenModal(true);
                        }}
                      className="text-emerald-600 hover:text-emerald-800">
                        <FiEdit2 />
                      </button>
                    </div>
    
                    {/* Email Address */}
                    <div className="flex justify-between items-center  border-b border-gray-300
          dark:border-[var(--border-color)]">                      
                        <div>
                        <p className="text-gray-500 text-sm dark:text-[var(--text-primary)]">Email Address</p>


                      <div className="flex gap-2 items-center">
                        <p className="text-blue-950 font-semibold dark:text-[var(--text-secondary)]">{userData?.email}</p>
                        <button  
                        onClick={() => {
         handleVerify("email")
        }} 
        className={userData?.is_email_verified ? "text-xs font-semibold text-white rounded-md" : "text-xs flex  font-semibold bg-yellow-500 hover:bg-yellow-600 text-white px-2 rounded-md h-4.5"}> { userData?.is_email_verified ? (
<ShieldCheck className="fill-green-600" size={20} /> ) :
"Verify"
        } </button>
                        </div>
        </div>

                      <button 
                      onClick={() => {
                        setEditType("email")
                        setOpenModal(true)
                      }}
                      className="text-emerald-600 hover:text-emerald-800">
                        <FiEdit2 />
                      </button>
                    </div>

      {/* Unique Client ID */}
      <div
        className="
          flex justify-between items-center
          border-b border-gray-300
          dark:border-[var(--border-color)]
        "
      >
        <div>
          <p className="text-gray-500 text-sm dark:text-[var(--text-secondary)]">
            Unique Client Code
          </p>
          <p className="text-blue-950 font-semibold dark:text-[var(--text-primary)]">
            1254789658
          </p>
        </div>

        <button
          className="
            text-emerald-600 hover:text-emerald-800
            dark:text-emerald-400 dark:hover:text-emerald-300
          "
        >
          <FiEdit2 />
        </button>
      </div>

      {/* Gender */}
      <div
        className="
          border-b border-gray-300
          dark:border-[var(--border-color)]
        "
      >
        <p className="text-gray-500 text-sm dark:text-[var(--text-secondary)]">
          Gender
        </p>
        <p className="text-blue-950 font-semibold dark:text-[var(--text-primary)]">
          -
        </p>
      </div>

      {/* Occupation */}
                    <div className=" border-b border-gray-300
          dark:border-[var(--border-color)]">
                      <p className="text-gray-500 text-sm dark:text-[var(--text-primary)]">Occupation</p>
                      <p className="text-blue-950 font-semibold dark:text-[var(--text-secondary)]">-</p>
                    </div>
    
                    {/* Father’s Name */}
                    <div className="flex justify-between items-center border-b border-gray-300
          dark:border-[var(--border-color)]">
                      <div>
                        <p className="text-gray-500 text-sm dark:text-[var(--text-primary)]">Father's Name</p>
                        <p className="text-blue-950 font-semibold dark:text-[var(--text-secondary)]">-</p>
                      </div>
                      <button 
                      onClick={() => {
                        setEditType("father'sName")
                        setOpenModal(true)
                      }}
                      className="text-emerald-600 hover:text-emerald-800">
                        <FiEdit2 />
                      </button>
                    </div>
    
                    {/* Address */}
                    <div className=" border-b border-gray-300
          dark:border-[var(--border-color)]">
                      <p className="text-gray-500 text-sm dark:text-[var(--text-primary)]">Address</p>
                      <p className="text-blue-950 font-semibold dark:text-[var(--text-secondary)]">-</p>
                    </div>

      {/* Links */}
      <div className="flex flex-col space-y-8">
        <div
          className="
            flex justify-between items-center py-4
            border-b border-gray-300
            dark:border-[var(--border-color)]
          "
        >
          <NavLink
            className="
              text-blue-900 text-sm font-semibold
              dark:text-[var(--text-primary)]
            "
          >
            Nominee Details
          </NavLink>
          <TfiAngleRight
            size={14}
            className="text-gray-400 dark:text-[var(--text-secondary)]"
          />
        </div>

        <div
          className="
            flex justify-between items-center py-4
            border-b border-gray-300
            dark:border-[var(--border-color)]
          "
        >
          <NavLink
            className="
              text-blue-900 font-semibold text-sm
              dark:text-[var(--text-primary)]
            "
          >
            Trading preference
          </NavLink>
          <TfiAngleRight
            size={14}
            className="text-gray-400 dark:text-[var(--text-secondary)]"
          />
        </div>
      </div>

       {/* RISK PROFILE CARD */}
            <div className="px-4 pb-4">
              {userData?.risk_profile ? (
                <div className="border border-gray-300 dark:border-slate-700 rounded-xl p-4 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="text-green-600" size={18} />
                    <h4 className="font-semibold text-green-700 dark:text-green-400">
                      Risk Profile Set
                    </h4>
                  </div>

                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <p>
                      <span className="font-medium text-green-600 dark:text-green-400">Category:</span>{" "}
                      {userData?.risk_profile?.profile}
                    </p>
                    <p>
                      <span className="font-medium">Equity Exposure:</span>{" "}
                      {riskProfile.equityLimit}
                    </p>
                    <p>
                      <span className="font-medium">Debt Exposure:</span>{" "}
                      {riskProfile.debtLimit}
                    </p>
                    <p>
                      <span className="font-medium">Gold Exposure:</span>{" "}
                      {riskProfile.goldLimit}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last updated: {formatDate(userData?.risk_profile?.updated_at)}
                    </p>
                  </div>

                  <button
                    onClick={() => redirectRiskProfile()}
                    className="mt-3 w-full text-sm py-2 rounded-lg
                               border border-green-600 text-green-700
                               hover:bg-green-100 dark:hover:bg-green-900/30"
                  >
                    Re-evaluate Risk Profile
                  </button>
                </div>
              ) : (
                <div className="border rounded-xl p-4 bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="text-yellow-600" size={18} />
                    <h4 className="font-semibold text-yellow-700 dark:text-yellow-400">
                      Risk Profile Not Set
                    </h4>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Complete risk profiling to get suitable investment
                    recommendations.
                  </p>

                  <button
                    onClick={() => navigate("/risk")}
                    className="mt-3 w-full text-sm py-2 rounded-lg
                               bg-yellow-600 text-white hover:bg-yellow-700"
                  >
                    Start Risk Profiling
                  </button>
                </div>
              )}
            </div>
    </div>
 
 
 
  </div>
  {openModal && (
  <EditModal
  handleVerifyOTP={handleVerifyOTP}
    type={editType}
    onClose={() => setOpenModal(false)}
  />
)}


 
</div>


      </>
  )
}

const EditModal = ({type, onClose, handleVerifyOTP, handleChangeDetails}) => {
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

      <div className="bg-white dark:bg-[var(--card-bg)] w-full max-w-md rounded-2xl p-6 shadow-xl ">

{/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
              {getTitle(type)}
          </h2>
          <button className="cursor-pointer" onClick={onClose}>✕</button>

        </div>

        {/* body */}
        {
  (type === "emailVerify" || type === "phoneVerify") ? 
    <EditFormForVerify 
      type={type} 
      handleVerifyOTP={handleVerifyOTP} 
      handleChangeDetails={handleChangeDetails} 
    />
  :
    <EditForm 
      type={type} 
      handleVerifyOTP={handleVerifyOTP} 
      handleChangeDetails={handleChangeDetails} 
    />
}

      </div>

    </div>
  )
}

const getTitle = (type) => {
  switch(type) {
    case "mobile" : return "Update mobile number"
    case "email" : return "Update email address"
    case "maritalStatus" : return "Update marital status"
    case "father'sName" : return "Update your data"
    case "income" : return "Update your data"
    case "phoneVerify" : return "Verify your phone number"
    case "emailVerify" : return "Verify your email"
  }
}

const EditFormForVerify = ({ type, handleVerifyOTP, handleChangeDetails }) => {
  
  const [value, setValue] = useState("");
  const config = getFieldConfig(type);
  console.log(config);
  console.log(type);
  

  return(
    <>
    <label className="text-sm font-medium">
      {config.label}
    </label>

    <input type={config.inputType}
    value={value}
    onChange={(e) => setValue(e.target.value)}
    placeholder={config.placeholder}
    className="w-full mt-2 p-2 border rounded-lg dark:bg-white/5 dark:border-white/10"
    />
      <button
      onClick={() => handleVerifyOTP(type, value)}
        className="w-full mt-4 bg-blue-600 hover:bg-blue-700
          text-white py-2 rounded-lg font-semibold"
      >
        {config.button}
      </button>
    </>
  )

}
const EditForm = ({ type, handleVerifyOTP, handleChangeDetails }) => {
  
  const [value, setValue] = useState("");
  const config = getFieldConfig(type);
  console.log(config);
  console.log(type);
  

  return(
    <>
    <label className="text-sm font-medium">
      {config.label}
    </label>

    <input type={config.inputType}
    value={value}
    onChange={(e) => setValue(e.target.value)}
    placeholder={config.placeholder}
    className="w-full mt-2 p-2 border rounded-lg dark:bg-white/5 dark:border-white/10"
    />
      <button
      onClick={() => handleChangeDetails(type, value)}
        className="w-full mt-4 bg-blue-600 hover:bg-blue-700
          text-white py-2 rounded-lg font-semibold"
      >
        {config.button}
      </button>
    </>
  )

}

const getFieldConfig = (type) => {
  switch(type){
    case "mobile" :
      return {
        label: "Mobile Number",
        inputType: "tel",
        placeholder: "Enter new mobile number",
        button: "Update mobile"
      };

     case "email" :
      return {
        label: "Email Address",
        inputType: "email",
        placeholder: "Enter new email address",
        button: "Update email"
      } 

     case "maritalStatus" :
      return {
        label: "Marital Status",
        inputType: "text",
        placeholder: "Enter your marital status",
        button: "Update status"
      }

     case "father'sName" : 
      return {
        label: "Father's Name",
        inputType: "text",
        placeholder: "Enter your father's name",
        button: "Update status"
      }

     case "income" :
      return {
        label: "Income",
        inputType: "text",
        placeholder: "Enter your income",
        button: "Update income",
      } 

      case "phoneVerify" :
        return {
          label: "Enter OTP",
          inputType: "text",
          placeholder: "Enter OTP sent to your phone number",
          button: "Verify"
        }

      case "emailVerify" :
        return {
          label: "Enter OTP",
          inputType: "text",
          placeholder: "Enter OTP sent to your email address",
          button: "Verify"
        }

      case "nominee" :
        return {
          
        }
  }
}

export default BasicDetails