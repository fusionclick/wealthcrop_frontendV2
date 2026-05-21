import { createSlice } from "@reduxjs/toolkit";

const mutualFundSlice = createSlice({
    name: "mutualFund",
    initialState: {
        fundsList: []
    },
    redducer: {
        setFunds: (state, action) => {
            state.fundsList = action.payload    
        }
    }
})

export const { setFunds } = mutualFundSlice.actions
export default mutualFundSlice.reducer;