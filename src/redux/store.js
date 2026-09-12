import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authenticationSlice';
// hoverMenu is gone: it drove Header.jsx / HoverSection.jsx, an older header that was
// never rendered — OldHeader is the live one, and each menu owns its own open state.
import stockReducer from './stockSlice'
import fundReducer from './mutualFundSlice'
import investorDataReducer from './investorDataSlice'

export const store = configureStore({
    reducer:{
        auth: authReducer,
        stocks: stockReducer,
        funds: fundReducer,
        investorData: investorDataReducer
    }
})