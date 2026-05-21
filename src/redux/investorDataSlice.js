import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getApiWithToken } from "../api/api";


const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_USER_DATA}`;

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
            state.data = action.payload;
          })
          .addCase(fetchInvestorData.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
          });
    }
})

export default investorDataSlice.reducer;