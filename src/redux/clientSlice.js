import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    ucc: null
}

const clientSlice = createSlice ({
    name: "client",
    initialState,
    reducers: {
        setUcc: (state, action) => state.ucc = action.payload
    }
})

export const {setUcc} = clientSlice.actions
export default clientSlice.reducer