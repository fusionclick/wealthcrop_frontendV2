import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getApiWithToken } from "../api/api";

const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_USER_DATA}`;

const TEST_EMAIL = "rminhal783@gmail.com";

// ponytail: test account — treat as KYC verified without Laravel/DB
const isTestInvestorEmail = (email) =>
  String(email || (typeof localStorage !== "undefined" ? localStorage.getItem("email") : "") || "")
    .toLowerCase() === TEST_EMAIL;

const markTestKyc = (data) => {
  const email = data?.email || (typeof localStorage !== "undefined" ? localStorage.getItem("email") : "");
  if (!isTestInvestorEmail(email)) return data;
  return {
    ...data,
    email: data?.email || email,
    kyc: {
      ...(data?.kyc || {}),
      kyc_status: "verified",
      // ponytail: backend ka fallback bhi yehi hai (mf/order.js investorUcc). Dono ka
      // ek hona zaroori hai, warna requireMatchingUcc 403 de deta hai. USRWC003 BSE par
      // PENDING_VERIFICATION hai aur order nahi leti; USRWC56442 APPROVED hai.
      ucc_code: data?.kyc?.ucc_code || data?.kyc?.ucc || "USRWC56442",
    },
    riskProfile: data?.riskProfile || data?.risk_profile || { profile: "Moderate", score: 1 },
  };
};

export const fetchInvestorData = createAsyncThunk(
    "investor/fetchInvestor",
    async(_, { rejectWithValue }) => {
        try {
            const response = await getApiWithToken(url); // API
      return response?.data?.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
)

const investorDataSlice = createSlice({
    name: "investor",
    initialState: {
        data: null,
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
          .addCase(fetchInvestorData.pending, (state) => {
            state.loading = true;
          })
          .addCase(fetchInvestorData.fulfilled, (state, action) => {
            state.loading = false;
            state.data = markTestKyc(action.payload);
          })
          .addCase(fetchInvestorData.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
          });
    }
})

export default investorDataSlice.reducer;