// store/hoverMenuSlice.js
import { createSlice } from "@reduxjs/toolkit";

const hoverMenuSlice = createSlice({
  name: "hoverMenu",
  initialState: {
    activeMenu: null,
    isVisible: false,
  },
  reducers: {
    setActiveMenu: (state, action) => {
      state.activeMenu = action.payload;
      state.isVisible = true;
    },
    clearMenu: (state) => {
      state.isVisible = false;
    },
    hideMenuNow: (state) => {
      state.activeMenu = null;
      state.isVisible = false;
    },
  },
});

export const { setActiveMenu, clearMenu, hideMenuNow } = hoverMenuSlice.actions;
export default hoverMenuSlice.reducer;
