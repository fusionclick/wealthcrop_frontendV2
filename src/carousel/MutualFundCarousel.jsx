import React, { useEffect, useRef, useState } from "react";
import { MdOutlineArrowDropDown, MdOutlineArrowDropUp } from "react-icons/md";
import { useQuery } from "@tanstack/react-query";
import { getApi } from "../api/api";
import { motion, useAnimation } from "framer-motion";

function MutualFundCarousel() {
  const [selectedFund, setSelectedFund] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [isReady, setIsReady] = useState(false); // content measured & ready
  const [contentWidth, setContentWidth] = useState(0);
  const [isScrolling, setIsScrolling] = useState(true);

  const controls = useAnimation();
  const motionRef = useRef(null);     // motion wrapper ref
  const contentRef = useRef(null);    // single content width ref
  const wrapperRef = useRef(null);    // outer wrapper

  const SPEED_PX_PER_SEC = 140; // tweak this: higher = faster (px per second)

  const url1 = `${import.meta.env.VITE_URLL}${import.meta.env.VITE_GET_MUTUAL_FUND}`;
  const { data } = useQuery({
    queryKey: ["MUTUAL_FUND_DATA"],
    queryFn: () => getApi(url1),
  });

  const funds = data?.["10 yr Government Bond"] || [];

  const getColor = (isUp) =>
  isUp
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";

  const getArrow = (isUp) =>
    isUp ? (
      <MdOutlineArrowDropUp className="text-lg inline" />
    ) : (
      <MdOutlineArrowDropDown className="text-lg inline" />
    );

  // helper: read current translateX of motionRef (pixels)
  const getCurrentTranslateX = () => {
    try {
      const el = motionRef.current;
      if (!el) return 0;
      const style = window.getComputedStyle(el);
      const transform = style.transform || style.webkitTransform;
      if (!transform || transform === "none") return 0;
      const match = transform.match(/matrix\((.+)\)/);
      if (match) {
        const values = match[1].split(",").map((v) => parseFloat(v.trim()));
        // matrix(a, b, c, d, tx, ty) -> tx is index 4
        return values[4];
      }
      // fallback for matrix3d
      const match3d = transform.match(/matrix3d\((.+)\)/);
      if (match3d) {
        const vals = match3d[1].split(",").map((v) => parseFloat(v.trim()));
        return vals[12]; // tx in matrix3d
      }
      return 0;
    } catch {
      return 0;
    }
  };

  // start/resume the marquee animation
  const startMarquee = (startX = 0, durationSec) => {
    // ensure motion element starts at startX
    controls.set({ x: startX });
    controls.start({
      x: -contentWidth,
      transition: {
        repeat: Infinity,
        ease: "linear",
        duration: durationSec,
      },
    });
  };

  // measure widths and initialize animation
  useEffect(() => {
    const measureAndStart = () => {
      if (!contentRef.current || !wrapperRef.current) return;
      const cw = contentRef.current.getBoundingClientRect().width;
      // if content width is zero or NaN, skip
      if (!cw || !isFinite(cw)) return;
      setContentWidth(cw);
      setIsReady(true);

      // duration = distance (contentWidth * 2) / speed because we animate duplicated strip width/2? 
      // We animate from x=0 to x=-contentWidth (we duplicate content twice), so distance = contentWidth
      // Duration based on SPEED_PX_PER_SEC:
      const duration = Math.max(6, contentWidth / SPEED_PX_PER_SEC); // min duration 6s
      // start at x = 0 so the strip is visible entering from right. But to make it appear from right instantly, set x = 0 and ensure wrapper overflow-hidden.
      // We'll start from x = 0 (content aligned left of wrapper) and animate to -contentWidth.
      startMarquee(0, duration);
      setIsScrolling(true);
    };

    // measure after a small delay so DOM settled
    const t = setTimeout(measureAndStart, 40);

    // re-measure on resize
    const onResize = () => {
      // stop and re-init
      controls.stop();
      setTimeout(measureAndStart, 80);
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // pause/resume when modal opens/closes
  useEffect(() => {
    if (!isReady) return;
    if (showModal) {
      // pause: capture current position and stop animation
      const currentX = getCurrentTranslateX();
      controls.stop();
      // set to exact currentX to avoid jump
      controls.set({ x: currentX });
      setIsScrolling(false);
    } else {
      // resume: compute remaining distance to -contentWidth
      const currentX = getCurrentTranslateX();
      // remaining distance in px:
      const remaining = Math.abs(currentX - -contentWidth);
      // if remaining is 0 or tiny, restart full loop
      const duration = Math.max(3, remaining / SPEED_PX_PER_SEC);
      startMarquee(currentX, duration);
      setIsScrolling(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, isReady]);

  // click handler — same logic as you had, but keep using rect without scroll offsets (fixed positioning)
  const handleItemClick = (fund, index) => {
    const item = document.getElementById(`fund-item-${index}`);
    if (!item) return;
    const rect = item.getBoundingClientRect();

    const modalHeight = 220;
    const modalWidth = 300;

    let topPosition = rect.bottom;
    let leftPosition = rect.left;

    if (topPosition + modalHeight > window.innerHeight) {
      topPosition = rect.top - modalHeight;
    }
    if (leftPosition + modalWidth > window.innerWidth) {
      leftPosition = window.innerWidth - modalWidth - 10;
    }
    if (leftPosition < 10) leftPosition = 10;

    setModalPosition({ top: topPosition + 10, left: leftPosition });
    setSelectedFund(fund);
    setShowModal(true);
  };

  // close modal on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showModal && e.target && !e.composedPath().includes(document.querySelector("#mf-modal"))) {
        // simple fallback: if click outside, close
        setShowModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showModal]);

  // if no funds yet, show placeholder bar (keeps height)
  if (!funds.length) {
    return (
      <div
  className="left-0 w-full bg-white dark:bg-gray-900 overflow-hidden"
  style={{ height: "40px" }}
>
  <div className="h-full flex items-center px-4 text-gray-500 dark:text-gray-400">
    Loading…
  </div>
</div>

    );
  }

  // build duplicated content (2x is enough)
  const duplicated = [...funds, ...funds];

  return (
    <div
  className="left-0 w-full bg-white dark:bg-gray-900 overflow-hidden"
  style={{ height: "40px" }}
  ref={wrapperRef}
>
  {/* motion wrapper - we animate this */}
  <motion.div
    ref={motionRef}
    className="flex whitespace-nowrap items-center h-full"
    animate={controls}
    initial={{ x: 0 }}
    style={{ cursor: "default" }}
  >
    {/* content (single copy) — measure width from this */}
    <div ref={contentRef} className="flex">
      {funds.map((fund, idx) => (
        <div
          key={`a-${idx}`}
          id={`fund-item-${idx}`}
          className="
            flex items-center px-4 cursor-pointer whitespace-nowrap
            hover:bg-gray-100 dark:hover:bg-white/10
            transition-all
          "
          onClick={() => handleItemClick(fund, idx)}
        >
          <span className="font-medium text-blue-950 dark:text-white">
            {fund.fund_name}
          </span>

          <span className="mx-2 text-sm text-gray-700 dark:text-gray-400">
            {fund.latest_nav}
          </span>

          <span
            className={`${getColor(
              fund.percentage_change >= 0
            )} text-sm`}
          >
            {getArrow(fund.percentage_change >= 0)}{" "}
            {fund.percentage_change}%
          </span>
        </div>
      ))}
    </div>

    {/* duplicate so loop is seamless */}
    <div className="flex" aria-hidden>
      {funds.map((fund, idx) => (
        <div
          key={`b-${idx}`}
          className="
            flex items-center px-4 whitespace-nowrap cursor-pointer
            hover:bg-gray-100 dark:hover:bg-white/10
            transition-all
          "
          onClick={() => handleItemClick(fund, idx)}
        >
          <span className="font-medium text-blue-950 dark:text-gray-200">
            {fund.fund_name}
          </span>

          <span className="mx-2 text-sm text-gray-700 dark:text-gray-400">
            {fund.latest_nav}
          </span>

          <span
            className={`${getColor(
              fund.percentage_change >= 0
            )} text-sm`}
          >
            {getArrow(fund.percentage_change >= 0)}{" "}
            {fund.percentage_change}%
          </span>
        </div>
      ))}
    </div>
  </motion.div>

  {/* Modal — fixed positioning so it stays visible */}
  {showModal && selectedFund && (
    <div
      id="mf-modal"
      className="
        fixed w-72 z-[2000] rounded-lg shadow-lg p-4
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-white/10
        text-gray-900 dark:text-gray-200
      "
      style={{
        top: modalPosition.top,
        left: modalPosition.left,
      }}
    >
      <a
        href={`/mutual-fund-Details/${selectedFund.fund_name}`}
        className="block font-semibold mb-2 text-blue-600 dark:text-blue-400 hover:underline"
      >
        {selectedFund.fund_name}
      </a>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
        Latest NAV: {selectedFund.latest_nav}
      </p>

      <p className="mb-2">
        <span className={getColor(selectedFund.percentage_change >= 0)}>
          {getArrow(selectedFund.percentage_change >= 0)}{" "}
          {selectedFund.percentage_change}%
        </span>
      </p>

      <div
        className="
          grid grid-cols-2 gap-3
          bg-gray-50 dark:bg-white/5
          backdrop-blur-md
          border border-gray-200 dark:border-white/10
          rounded-xl p-4 shadow-sm
        "
      >
        <div className="flex flex-col">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Asset Size
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-200">
            {selectedFund.asset_size} Cr
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            1 Yr Return
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-200">
            {selectedFund["1_year_return"]}%
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            3 Yr Return
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-200">
            {selectedFund["3_year_return"]}%
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            5 Yr Return
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-200">
            {selectedFund["5_year_return"]}%
          </span>
        </div>
      </div>
    </div>
  )}
</div>

  );
}

export default MutualFundCarousel;
