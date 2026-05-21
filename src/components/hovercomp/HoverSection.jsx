import { useSelector, useDispatch } from "react-redux";
import { hideMenuNow } from "../../redux/hoverMenuSlice";
import { useEffect } from "react";
import StocksMenu from "./StocksMenu";
import FOMenu from "./FOMenu";
import MutualFundsMenu from "./MutualFundsMenu";
import MoreMenu from "./MoreMenu";

export default function HoverSection() {
  const { activeMenu, isVisible } = useSelector((state) => state.hoverMenu);
  const dispatch = useDispatch();

  // when fading out, fully hide after transition completes
  useEffect(() => {
    let timer;
    if (!isVisible && activeMenu) {
      timer = setTimeout(() => {
        dispatch(hideMenuNow());
      }, 300); // matches fade-out duration
    }
    return () => clearTimeout(timer);
  }, [isVisible, activeMenu, dispatch]);

  if (!activeMenu && !isVisible) return null;

  return (
    <div
      className={`fixed top-[64px] left-0 w-full z-40 transition-all duration-300
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}
      onMouseEnter={() => clearTimeout()} // cancel hide on re-enter
      onMouseLeave={() => dispatch(hideMenuNow())}
    >
      <div className="w-full bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-[1200px] mx-auto px-6 py-4">
          {activeMenu === "stocks" && <StocksMenu />}
          {activeMenu === "fo" && <FOMenu />}
          {activeMenu === "mutual" && <MutualFundsMenu />}
          {activeMenu === "more" && <MoreMenu />}
        </div>
      </div>
    </div>
  );
}
