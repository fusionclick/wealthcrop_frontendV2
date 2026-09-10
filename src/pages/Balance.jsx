import React from "react";
import { useSelector } from "react-redux";
import setupImg from "../assets/setup.svg";
import { useNavigate } from "react-router-dom";
import { isKycVerified } from "../utils/kycVerdict";

const Balance = () => {
  const navigate = useNavigate();

  // Ye page pehle har haal mein "Complete your KYC" kehta tha — bina kabhi kyc_status
  // dekhe. BSE se verified investor ko bhi wahi screen milti thi jo ek naye user ko,
  // aur "Complete KYC" button use dobara usi KYC flow par bhej deta tha jo wo pehle hi
  // mukammal kar chuka tha. investorData Redux mein pehle se maujood hai (App mount par
  // fetchInvestorData chalta hai) — usi ko parh lo, naya fetch ki zarurat nahi.
  const { data: investor } = useSelector((state) => state.investorData);
  const kycDone = isKycVerified(investor?.kyc?.kyc_status);

  // ponytail: funding backend abhi hai hi nahi, is liye koi balance dikhane ko nahi.
  // Farq sirf itna hai ke wajah sach bata di jaye: KYC ho chuki ho to masla KYC nahi.
  return (
    <div className="bg-white dark:bg-[var(--app-bg)] min-h-[400px] rounded-xl p-8 flex items-center justify-center">
      <div className="flex flex-col items-center text-center gap-5 px-6 py-10">
        <img
          src={setupImg}
          alt="Setup account"
          className="w-40 md:w-60 object-contain opacity-90"
        />
        <div>
          <h2 className="text-2xl font-semibold text-blue-950 dark:text-[var(--text-primary)] mb-2">
            Funds account not linked yet
          </h2>
          <p className="text-gray-600 dark:text-[var(--text-secondary)] text-sm md:text-base max-w-md">
            {kycDone ? (
              <>
                Your KYC is verified. Adding funds needs a linked broker account,
                <br /> which isn’t connected on this account yet.
              </>
            ) : (
              <>
                We can’t show a balance until your funds account is connected.
                <br /> Complete your KYC and link a broker account to get started.
              </>
            )}
          </p>
        </div>

        {/* Verified user ko dobara KYC par bhejne ka koi matlab nahi. */}
        {kycDone ? (
          <button
            type="button"
            onClick={() => navigate("/user/mutual_fund/explore")}
            className="bg-blue-950 hover:bg-blue-900 dark:bg-blue-400 dark:hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition"
          >
            Explore funds
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate("/kyc")}
            className="bg-blue-950 hover:bg-blue-900 dark:bg-blue-400 dark:hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition"
          >
            Complete KYC
          </button>
        )}
      </div>
    </div>
  );
};

export default Balance;
