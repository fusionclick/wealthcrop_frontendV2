import { createSlice } from "@reduxjs/toolkit";

const stockSlice = createSlice({
    name: "stocks",
    initialState: {
        stockList: []
    },
    reducers: {
        setStocks: (state, action) => {
            state.stockList = action.payload
        }
    }
})

export const {setStocks} = stockSlice.actions
export default stockSlice.reducer;