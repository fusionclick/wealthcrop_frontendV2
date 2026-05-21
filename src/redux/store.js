import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authenticationSlice';
import hoverMenuReducer from './hoverMenuSlice'
import stockReducer from './stockSlice'
import fundReducer from './mutualFundSlice'
import investorDataReducer from './investorDataSlice'

export const store = configureStore({
    reducer:{
        auth: authReducer,
        hoverMenu: hoverMenuReducer,
        stocks: stockReducer,
        funds: fundReducer,
        investorData: investorDataReducer
    }
})