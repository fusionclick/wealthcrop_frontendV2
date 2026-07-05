import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Portfolio from "./pages/Portfolio";
import Profile from "./pages/Profile";
import Login from "./auth/Login";
import Register from "./auth/Register";
import SipCalculator from "./pages/calculators/SipCalculator";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { lazy, Suspense, useEffect, useState } from "react";
import Dashboard from "./components/DashBoard";
import HoverSection from "./components/hovercomp/HoverSection";
import OldHeader from "./components/OldHeader";
import ProtectRoute from "./components/ProtectRoute";
import FODashboard from "./components/F&ODashboard";
import MFDashboard from "./components/MFDashboard";
import Header2 from "./components/Header2";
import { useDispatch, useSelector } from "react-redux";
import BasicDetails from "./pages/profile/BasicDetails";
import ChangePassword from "./pages/profile/ChangePassword";
import ChangePin from "./pages/profile/ChangePin";
import ReportActivity from "./pages/profile/ReportActivity";
import AccountForm from "./pages/profile/AccountForm";
import Explore from "./pages/stocks/Explore";
import Holdings from "./pages/stocks/Holdings";
import Positions from "./pages/stocks/Positions";
import Orders from "./pages/stocks/Orders";
import Watchlist from "./pages/stocks/Watchlist";
import NomineeDetails from "./pages/profile/NomineeDetails";
import UserOrder from "./pages/profile/order/UserOrder";
import Stocks from "./pages/profile/order/Stocks";
import FutureandOptions from "./pages/profile/order/FutureandOptions";
import MutualFundOrder from "./pages/profile/order/MutualFundOrder";
import Support from "./pages/Support";
import Reports from "./pages/Reports";
import Balance from "./pages/Balance";
import AddMoney from "./pages/AddMoney";
import BottomHeader from "./components/BottomHeader";
import ExploreMF from "./pages/mutual_fund/ExploreMF";
import WatchlistMF from "./pages/mutual_fund/WatchlistMF";
import DashBoardMF from "./pages/mutual_fund/DashBoardMF";
import SIPs from "./pages/mutual_fund/SIPs";
import FundDetails from "./pages/mutual_fund/FundDetails";
// import StockDetails from "./components/StockDetails";
import MutualFundCarousel from "./carousel/MutualFundCarousel";
import DraggableQRCodeCard from "./components/DraggableQRCodeCard";
import NFO from "./pages/NFO";
import FDCalculator from "./pages/calculators/FDCalculator";
import RetirementCalculator from "./pages/calculators/RetirementCalculator";
import CalculatorsPage from "./pages/calculators/CalculatorsPage";
import { calculatorRoutes } from "./utils/CalculatorRoutes";
import ScrollToTopButton from "./utils/ScrollToTopButton";
import IndicesDetails from "./pages/IndicesDetails";
import InvestmentOptions from "./pages/InvestmentOptions";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import ChartPage from "./components/chart/ChartPage";
import TerminalChart from "./components/chart/TerminalChart";
import TradingViewWidget from "./components/chart/TradingViewWidget";
import GrowChart from "./components/chart/GrowChart";
import FundCategorySection from "./pages/mutual_fund/FundCategorySection";
import IpoDashboardPage from "./components/ipo/IpoDashboardPage";
import ManageSipPage from "./components/sip/ManageSipPage";
import IpoDetails from "./components/ipo/IpoDetails";
import BondPage from "./components/BondPage";
import ErrorPage from "./components/ErrorPage";
import { OneTimeInvestmentPage } from "./components/OneTimeInvestmentPage";
import { SIPInvestmentPage } from "./components/SIPInvestmentPage";
import TrackPage from "./components/TrackPage";
import DematAccountPage from "./pages/DematAccountPage";
import LearningCenterPage from "./pages/LearningCenterPage";
import MarketNewsPage from "./pages/MarketNewsPage";
import MutualFundLearning from "./pages/MutualFundLearning";
import StockMarketLearning from "./pages/StockMarketLearning";
import SIPWealthLearning from "./pages/SIPWealthLearning";
import TaxPlanningLearning from "./pages/TaxPlanningLearning";
import BasketList from "./pages/basket/BasketList";
import CreateBasket from "./pages/basket/CreateBasket";
import BasketDetails from "./pages/basket/BasketDetails";

import basketsData from "./data/baskets";
import basketDetailsData from "./data/basketDetails";
import Invest from "./pages/basket/Invest";
import Performance from "./pages/basket/Performance";
import AMCPage from "./pages/AMCPage";
import VideoKYC from "./components/VideoKYC";
import KYC from "./components/kyc/KYC";
import RiskProfilingPage from "./pages/riskProfile/RiskProfilingPage";
import MutualFundInvestPage from "./pages/mutual_fund/MutualFundInvestPage";
import SIPSetupPage from "./pages/mutual_fund/SIPSetupPage";
import RedeemMF from "./pages/mutual_fund/RedeemMF";
import SwitchMF from "./pages/mutual_fund/SwitchMF";
import ExploreFO from "./pages/future_&_options/ExploreFO";
import PositionsFO from "./pages/future_&_options/PositionsFO";
import OrdersFO from "./pages/future_&_options/OrdersFO";
import { isPinExpired } from "./utils/pinExpireChecker";
import LoginPinModal from "./utils/LoginPinModal";
import ResetPassword from "./pages/ResetPassword";
import StockHandler from "./utils/socketHandler";
import SocketHandler from "./utils/socketHandler";
import ResetPin from "./pages/ResetPin";
import Notifications from "./pages/Notifications";
import StockList from "./pages/stocks/StockList";
import PageLoader from "./components/PageLoader";
import { toastError } from "./utils/notifyCustom";
import { getApiWithToken } from "./api/api";
import { fetchInvestorData } from "./redux/investorDataSlice";


const queryClient = new QueryClient();

function App() {

// Core pages
// const Home = lazy(() => import("./pages/Home"));
// const Portfolio = lazy(() => import("./pages/Portfolio"));
// const Profile = lazy(() => import("./pages/Profile"));
// const Support = lazy(() => import("./pages/Support"));
// const Reports = lazy(() => import("./pages/Reports"));
// const Balance = lazy(() => import("./pages/Balance"));
// const AddMoney = lazy(() => import("./pages/AddMoney"));
// const Blog = lazy(() => import("./pages/Blog"));
// const BlogPost = lazy(() => import("./pages/BlogPost"));
// const DematAccountPage = lazy(() => import("./pages/DematAccountPage"));
// const LearningCenterPage = lazy(() => import("./pages/LearningCenterPage"));
// const MarketNewsPage = lazy(() => import("./pages/MarketNewsPage"));


// Dashboard
// const Dashboard = lazy(() => import("./components/DashBoard"));
// const FODashboard = lazy(() => import("./components/F&ODashboard"));
// const MFDashboard = lazy(() => import("./components/MFDashboard"));

// // Profile section
// const BasicDetails = lazy(() => import("./pages/profile/BasicDetails"));
// const ChangePassword = lazy(() => import("./pages/profile/ChangePassword"));
// const ChangePin = lazy(() => import("./pages/profile/ChangePin"));
// const ReportActivity = lazy(() => import("./pages/profile/ReportActivity"));
// const AccountForm = lazy(() => import("./pages/profile/AccountForm"));
// const NomineeDetails = lazy(() => import("./pages/profile/NomineeDetails"));

// // Orders
// const UserOrder = lazy(() => import("./pages/profile/order/UserOrder"));
// const Stocks = lazy(() => import("./pages/profile/order/Stocks"));
// const FutureandOptions = lazy(() =>
//   import("./pages/profile/order/FutureandOptions")
// );
// const MutualFundOrder = lazy(() =>
//   import("./pages/profile/order/MutualFundOrder")
// );

//! Stocks
// const Explore = lazy(() => import("./pages/stocks/Explore"));
// const Holdings = lazy(() => import("./pages/stocks/Holdings"));
// const Positions = lazy(() => import("./pages/stocks/Positions"));
// const Orders = lazy(() => import("./pages/stocks/Orders"));
// const Watchlist = lazy(() => import("./pages/stocks/Watchlist"));
// const StockList = lazy(() => import("./pages/stocks/StockList"));
const StockDetails = lazy(() => import("./components/StockDetails"));

// // Mutual Funds
// const ExploreMF = lazy(() => import("./pages/mutual_fund/ExploreMF"));
// const WatchlistMF = lazy(() => import("./pages/mutual_fund/WatchlistMF"));
// const DashBoardMF = lazy(() => import("./pages/mutual_fund/DashBoardMF"));
// const SIPs = lazy(() => import("./pages/mutual_fund/SIPs"));
// const FundDetails = lazy(() => import("./pages/mutual_fund/FundDetails"));
// const FundCategorySection = lazy(() =>
//   import("./pages/mutual_fund/FundCategorySection")
// );
// const MutualFundInvestPage = lazy(() =>
//   import("./pages/mutual_fund/MutualFundInvestPage")
// );

// // Calculators
// const SipCalculator = lazy(() =>
//   import("./pages/calculators/SipCalculator")
// );
// const FDCalculator = lazy(() =>
//   import("./pages/calculators/FDCalculator")
// );
// const RetirementCalculator = lazy(() =>
//   import("./pages/calculators/RetirementCalculator")
// );
// const CalculatorsPage = lazy(() =>
//   import("./pages/calculators/CalculatorsPage")
// );

// // IPO / Bonds / NFO
// const IpoDashboardPage = lazy(() =>
//   import("./components/ipo/IpoDashboardPage")
// );
// const IpoDetails = lazy(() => import("./components/ipo/IpoDetails"));
// const BondPage = lazy(() => import("./components/BondPage"));
// const NFO = lazy(() => import("./pages/NFO"));

// // Basket
// const BasketList = lazy(() => import("./pages/basket/BasketList"));
// const CreateBasket = lazy(() => import("./pages/basket/CreateBasket"));
// const BasketDetails = lazy(() => import("./pages/basket/BasketDetails"));
// const Invest = lazy(() => import("./pages/basket/Invest"));
// const Performance = lazy(() => import("./pages/basket/Performance"));

// // Charts (heavy → MUST lazy)
// const ChartPage = lazy(() => import("./components/chart/ChartPage"));
// const TerminalChart = lazy(() =>
//   import("./components/chart/TerminalChart")
// );
// const TradingViewWidget = lazy(() =>
//   import("./components/chart/TradingViewWidget")
// );
// const GrowChart = lazy(() => import("./components/chart/GrowChart"));

// // Misc
// const HoverSection = lazy(() =>
//   import("./components/hovercomp/HoverSection")
// );
// const MutualFundCarousel = lazy(() =>
//   import("./carousel/MutualFundCarousel")
// );
// const DraggableQRCodeCard = lazy(() =>
//   import("./components/DraggableQRCodeCard")
// );
// const IndicesDetails = lazy(() =>
//   import("./pages/IndicesDetails")
// );
// const InvestmentOptions = lazy(() =>
//   import("./pages/InvestmentOptions")
// );
// const ExploreFO = lazy(() =>
//   import("./pages/future_&_options/ExploreFO")
// );
// const PositionsFO = lazy(() =>
//   import("./pages/future_&_options/PositionsFO")
// );
// const OrdersFO = lazy(() =>
//   import("./pages/future_&_options/OrdersFO")
// );
// const Notifications = lazy(() =>
//   import("./pages/Notifications")
// );

// // Investment pages
// const OneTimeInvestmentPage = lazy(() =>
//   import("./components/OneTimeInvestmentPage")
// );
// const SIPInvestmentPage = lazy(() =>
//   import("./components/SIPInvestmentPage") 
// );


  // const [token, setToken] = useState(localStorage.getItem("token"));
  //   const [token, setToken] = useState(localStorage.getItem("token"));

  // useEffect(() => {
  //   setToken(localStorage.getItem("token"));
  // }, []);

  const [locked, setLocked] = useState(false);


  const { pathname } = useLocation();
  const { token } = useSelector((state) => state.auth);
    // const [baskets] = useState(basketsData); // static for now
  const [basketDetails] = useState(basketDetailsData);
  const [baskets, setBaskets] = useState([]);

    useEffect(() => {

      if(!token) return

      const fetchBasket = async () => {
        const url = `${import.meta.env.VITE_URL}/baskets`;
        // setLoading(true);

        try {
          const res = await getApiWithToken(url);
          console.log("All Baskets", res?.data);
          setBaskets(res?.data?.data);
        } catch (error) {
          toastError(error.message);
        }
      };

      fetchBasket();
    }, [token]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeCategory, setActiveCategory] = useState("stocks");

  const [isLg, setIsLg] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsLg(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navigate = useNavigate();

  //   useEffect(() => {
  //   if (window.innerWidth < 1024) {
  //     setActiveCategory("stocks"); // default
  //     navigate("/user/stocks/explore");
  //   }
  // }, []);

  const location = useLocation();

useEffect(() => {
  const check = () => {
    if (token && isPinExpired()) { // ADD token check
      setLocked(true);
    }
  };

  check();

  const interval = setInterval(check, 5000);

  return () => clearInterval(interval);
}, [token]);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      if (location.pathname === "/") {
        navigate("/user/stocks/explore", { replace: true });
      }
    }
  }, []);

    const dispatch = useDispatch();

    useEffect(() => {
  if (token) {
    dispatch(fetchInvestorData());
  }
}, [dispatch, token]);



  // useEffect(() => {
  //   // Listen for token changes (manual refresh of state)
  //   const handleStorageChange = () => {
  //     setToken(localStorage.getItem("token"));
  //   };
  //   window.addEventListener("storage", handleStorageChange);
  //   return () => window.removeEventListener("storage", handleStorageChange);
  // }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SocketHandler />
      {locked && <LoginPinModal onSuccess={() => setLocked(false)} />}
      {/*  Always on top of everything */}
      {/* <div className="fixed top-0 left-0 w-full z-[60]">
      <MutualFundCarousel />
    </div> */}
      {/*  Fixed Header */}
      {/*  Large screens (always show OldHeader) */}
      <ScrollToTopButton />
      <DraggableQRCodeCard value="https://example.com" size={100} />
      {/* ================= TOP HEADER ================= */}
      {(!token || isLg) && <OldHeader />}

      {/* Top spacer */}
      {(!token || isLg) && <div className="h-[96px]" />}

      {/* Mobile screens */}
      {/* <div className="block lg:hidden fixed top-0 left-0 w-full z-50 bg-white dark:bg-[var(--app-bg)]">
        {token ? <Header2 activeCategory={activeCategory} /> : <OldHeader />}
      </div> */}

      {/*  Page Content */}
      <main className="min-h-screen bg-white dark:bg-[var(--app-bg)]">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Protected routes */}
            <Route element={<ProtectRoute user={token} />}>
              {/* Stocks */}
              <Route path="/user/stocks" element={<Dashboard />}>
                <Route index element={<Navigate to="explore" replace />} />
                <Route path="explore" element={<Explore />} />
                <Route path="holdings" element={<Holdings />} />
                <Route path="positions" element={<Positions />} />
                <Route path="orders" element={<Orders />} />
                <Route path="watchlist" element={<Watchlist />} />
              </Route>

              {/* MutualFund */}
              <Route path="/user/mutual_fund" element={<MFDashboard />}>
                <Route index element={<Navigate to="explore" replace />} />
                <Route path="explore" element={<ExploreMF />} />
                <Route path="investments" element={<DashBoardMF />} />
                <Route path="sip" element={<SIPs />} />
                <Route path="watchlist" element={<WatchlistMF />} />
              </Route>

              {/* Future and Options */}
              <Route path="/user/future_and_options" element={<FODashboard />}>
                <Route index element={<Navigate to="explore" replace />} />
                <Route path="explore" element={<ExploreFO />} />
                <Route path="positions" element={<PositionsFO />} />
                <Route path="orders" element={<OrdersFO />} />
              </Route>

              <Route path="/mutual_fund/manage-sip" element={<ManageSipPage />} />
              <Route path="/mutual_fund/sip-setup" element={<SIPSetupPage />} />
              <Route path="/mutual_fund/redeem" element={<RedeemMF />} />
              <Route path="/mutual_fund/switch" element={<SwitchMF />} />
              <Route
                path="mutual_fund/collections/:categorySlug"
                element={<FundCategorySection />}
              />

              {/* F&O and Mutual Fund */}
              <Route path="/user/f&o" element={<FODashboard />} />
              {/* <Route path="/user/mutual_fund" element={<MFDashboard />} /> */}

              {/* Profile Order */}
              <Route path="/user/order" element={<UserOrder />}>
                <Route index element={<Navigate to="stocks" replace />} />
                <Route path="stocks" element={<Stocks />} />
                <Route
                  path="futures-and-options"
                  element={<FutureandOptions />}
                />
                <Route path="mutual-funds" element={<MutualFundOrder />} />
              </Route>

              {/* Profile */}

              {isLg ? (
                <Route path="/profile" element={<Profile />}>
                  <Route index element={<Navigate to="basic" replace />} />
                  <Route path="basic" element={<BasicDetails />} />
                  <Route path="change-password" element={<ChangePassword />} />
                  <Route path="change-pin" element={<ChangePin />} />
                  <Route path="report-activity" element={<ReportActivity />} />
                  <Route path="nominee_details" element={<NomineeDetails />} />
                  <Route path="account-forms" element={<AccountForm />} />
                </Route>
              ) : (
                <>
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/basic" element={<BasicDetails />} />
                  <Route
                    path="/profile/change-password"
                    element={<ChangePassword />}
                  />
                  <Route path="/profile/change-pin" element={<ChangePin />} />
                  <Route
                    path="/profile/report-activity"
                    element={<ReportActivity />}
                  />
                  <Route
                    path="/profile/nominee_details"
                    element={<NomineeDetails />}
                  />
                  <Route
                    path="/profile/account-forms"
                    element={<AccountForm />}
                  />
                </>
              )}
              <Route path="/support" element={<Support />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/user/balance" element={<Balance />} />
              <Route path="/user/balance/inr" element={<AddMoney />} />
              <Route path="/investments" element={<InvestmentOptions />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/risk" element={<RiskProfilingPage />} />
              <Route
                path="/mutual_fund/:name/purchase_fund"
                element={<MutualFundInvestPage />}
              />
              <Route path="/stockList/:name" element={<StockList />} />

              <Route path="/bond" element={<BondPage />} />

              {/* Baskets */}
              <Route
                path="/baskets"
                element={<BasketList baskets={baskets} />}
              />

              <Route
                path="/basket/:id"
                element={
                  <BasketDetails
                    baskets={baskets}
                    basketDetails={basketDetails}
                  />
                }
              />

              <Route
                path="/invest/:id"
                element={<Invest baskets={baskets} />}
              />

              <Route
                path="/performance/:id"
                element={<Performance basketDetails={basketDetails} />}
              />
              <Route path="/create-basket" element={<CreateBasket />} />
            </Route>

            {/* Public routes */}
            <Route
              path="/"
              element={token ? <Navigate to="/user/stocks" /> : <Home />}
            />
            <Route path="*" element={<ErrorPage />} />

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-pin" element={<ResetPin />} />
            <Route path="/nfo" element={<NFO />} />
            <Route
              path="/mutual_fund/:isin/:code"
              element={
                <Suspense fallback={<PageLoader/>} >
                  <FundDetails />
                </Suspense>
              }
            />
            {/* <Route path="/stocks/:name" element={<StockDetails />} /> */}
            <Route
              path="/stocks/:name"
              element={
                <Suspense fallback={<PageLoader />}>
                  <StockDetails />
                </Suspense>
              }
            />
            <Route path="/indices/:name" element={<IndicesDetails />} />
            <Route path="/blogs" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/amc/:amcName" element={<AMCPage />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/loader" element={<PageLoader />} />

            {/* IPO */}
            <Route path="/ipo" element={<IpoDashboardPage />} />
            <Route path="/ipo/:ipoName" element={<IpoDetails />} />

            <Route
              path="/one-time-investment"
              element={<OneTimeInvestmentPage />}
            />
            <Route path="/sip-investment" element={<SIPInvestmentPage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/demat-account" element={<DematAccountPage />} />
            <Route path="/learning-centre" element={<LearningCenterPage />} />
            <Route path="/market-news" element={<MarketNewsPage />} />

            {/* Learning Centre */}
            <Route
              path="/learning-centre/mutual_fund"
              element={<MutualFundLearning />}
            />
            <Route
              path="/learning-centre/stock_market"
              element={<StockMarketLearning />}
            />
            <Route
              path="/learning-centre/sip_investment"
              element={<SIPWealthLearning />}
            />
            <Route
              path="/learning-centre/tax_planning"
              element={<TaxPlanningLearning />}
            />

            <Route path="/chart" element={<ChartPage />} />
            {/* <Route path="/terminal" element={<TerminalChart/>} /> */}
            <Route path="/terminal" element={<TradingViewWidget />} />
            {/* <Route path="/terminal" element={<GrowChart/>} /> */}

            {/* Calculators */}
            <Route path="/calculators" element={<CalculatorsPage />} />
            {/* <Route path="/kyc" element={<VideoKYC />} /> */}
            <Route path="/kyc" element={<KYC />} />

            {calculatorRoutes.map((route, i) => (
              <Route
                key={i}
                path={`/calculator/${route.path}`}
                element={route.element}
              />
            ))}
          </Routes>
        </Suspense>
      </main>

      {/* ================= FOOTER ================= */}
      <Footer />

      {/*  BOTTOM SPACER (mobile only, matches BottomHeader height) */}
      {token && <div className="h-[72px] lg:hidden" />}

      {/* ================= FIXED BOTTOM HEADER (MOBILE) ================= */}
      {token && (
        <div className="fixed bottom-0 left-0 w-full z-50 lg:hidden">
          <BottomHeader />
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </QueryClientProvider>
  );
}

export default App;
