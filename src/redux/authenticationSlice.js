import { createSlice } from "@reduxjs/toolkit"

// Load token and expiry from localStorage
const storedToken = localStorage.getItem("token")
const storedExpiry = localStorage.getItem("token_expiry")

// Check if expired
const isExpired = storedExpiry && Date.now() > Number(storedExpiry)

const initialState = {
    token: !isExpired ? storedToken : null
}

// If expired clear storage
if(isExpired){
    localStorage.removeItem("token")
    localStorage.removeItem("token_expiry")
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login:(state, action)=> {
            state.token = action.payload;
            // Store token
            localStorage.setItem("token",action.payload)

            // set expiry time : now + 24 hrs
            const expiryTime = Date.now() + 24 * 60 * 60 * 1000;
            localStorage.setItem("token_expiry",expiryTime)
        },
        logout:(state)=> {
            state.token = null;
            localStorage.removeItem("token")
            localStorage.removeItem("token_expiry")

        }
    }

})

export const {login, logout} = authSlice.actions;
export default authSlice.reducer;