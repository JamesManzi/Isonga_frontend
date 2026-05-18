import { BrowserRouter,Routes,Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Register from "./Register";
import Login from "./Login";
import Buyer_Register from "./Buyer_Register";
import Buyer_Login from "./Buyer_Login";
import Home from "./Home";
import Dashboard from "./Dashboard";
import Add_Product from "./Add_Product";
import My_Store from "./My_Store";
import Seller_Profile from "./Seller_Profile";
import Buyer_Dashboard from "./Buyer_Dashboard";
import View_Profile from "./View_Profile";
import View_Products from "./View_Products";
import Livestock from "./Livestock";
import Services from "./Services";
import Fashion from "./Fashion";
import RealEstate from "./RealEstate";
import Vehicles from "./Vehicles";
import Hospitality from "./Hospitality";
import Electronics from "./Electronics";
import Furniture from "./Furniture";
import Construction from "./Construction";
import Buyer_Profile from "./Buyer_Profile";
import Steps from "./Steps";
import Help from "./Help";
import Buyer_Chat from "./Buyer_Chat";
import Seller_Chat from "./Seller_Chat";
import SellerConversations from "./SellerConversations";
import BuyerConversations from "./BuyerConversations";
import Cart from "./Cart";
import Checkout from "./Checkout";
import SellerOrders from "./SellerOrders";
import Service_Products from "./Service_Products";
import Asset_Products from "./Asset_Products";
import Booking from "./Booking";
import SellerBookings from "./SellerBookings";
import SellerOrderHistory from "./SellerOrderHistory";
import SellerBookingHistory from "./SellerBookingHistory";
import VerifyEmail from "./VerifyEmail";
import ForgotPassword from "./ForgotPassword";
import Notifications_Page from "./Notifications_Page";
import BuyerOrderDetails from "./BuyerOrderDetails";
import BuyerBookingDetails from "./BuyerBookingDetails";
import SellerForgotPassword from "./SellerForgotPassword";
import Food from "./Food";
import VerifyBuyerEmail from "./VerifyBuyerEmail";
import  VerifySellerEmail from "./VerifySellerEmail";
import HelpCenter from "./HelpCenter";
import Steping from "./Steping";
import PrivacyRules from "./PrivacyRules";
import AdminDashboard from "./AdminDashboard";
import { Analytics } from "@vercel/analytics/react";
import AdminManageSellers from "./AdminManageSellers";
import DeleteProducts from "./DeleteProducts";
import DeleteServices from "./DeleteServices";
import DeleteAssets from "./DeleteAssets";
import AdminOrders from "./AdminOrders";
function App(){
  return(
    <div>
      <HelmetProvider>
      <BrowserRouter>
       <Analytics />
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/register" element={<Register/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/buyer_register" element={<Buyer_Register/>}/>
        <Route path="/buyer_login" element={<Buyer_Login/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="/add_product" element={<Add_Product/>}/>
        <Route path="/my_store" element={<My_Store/>}/>
        <Route path="/seller_profile" element={<Seller_Profile/>}/>
        <Route path="/buyer_dashboard" element={<Buyer_Dashboard/>}/>
        <Route path="/view_profile/:id" element={<View_Profile/>}/>
        <Route path="/view_products/:id" element={<View_Products/>}/>
        <Route path="/Livestock" element={<Livestock/>}/>
        <Route path="/services" element={<Services/>}/>
        <Route path="/fashion" element={<Fashion/>}/>
        <Route path="/RealEstate" element={<RealEstate/>}/>
        <Route path="/Vehicles" element={<Vehicles/>}/>
        <Route path="/Hospitality" element={<Hospitality/>}/>
        <Route path="/Electronics" element={<Electronics/>}/>
        <Route path="/Furniture" element={<Furniture/>}/>
        <Route path="/Construction" element={<Construction/>}/>
        <Route path="/buyer_profile" element={<Buyer_Profile/>}/>
        <Route path="/Steps" element={<Steps/>}/>
        <Route path="/Help" element={<Help/>}/>
        <Route path="/buyer_chat/:sellerId" element={<Buyer_Chat />} />
        <Route path="/seller_chat/:buyerId" element={<Seller_Chat />} />
        <Route path="/SellerConversations" element={<SellerConversations/>}/>
        <Route path="/BuyerConversations" element={<BuyerConversations/>}/>
        <Route path="/Cart" element={<Cart/>}/>
        <Route path="/checkout" element={<Checkout/>}/>
        <Route path="/seller_orders" element={<SellerOrders/>}/>
        <Route path="/Service_products/:id" element={<Service_Products/>}/>
        <Route path="/Asset_products/:id" element={<Asset_Products/>}/>
        <Route path="/book/:productId" element={<Booking />} />
        <Route path="/seller_bookings" element={<SellerBookings />} />
        <Route path="/SellerOrderHistory" element={<SellerOrderHistory/>}/>
        <Route path="/SellerBookingHistory" element={<SellerBookingHistory/>}/>
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword/>}/>
         <Route path="/notifications" element={<Notifications_Page />} />
         <Route path="/buyer/order/:id" element={<BuyerOrderDetails />} />
         <Route path="/buyer/booking/:id" element={<BuyerBookingDetails />} />
         <Route path="/Food" element={<Food/>}/>
         <Route path="/SellerForgotPassword" element={<SellerForgotPassword/>}/>
         <Route path="/VerifyBuyerEmail" element={<VerifyBuyerEmail/>}/>
         <Route path="/VerifySellerEmail" element={< VerifySellerEmail/>}/>
         <Route path="/help-center" element={<HelpCenter/>}/>
         <Route path="/Steping" element={<Steping/>}/>
         <Route path="/PrivacyRules" element={<PrivacyRules/>}/>
         <Route path="/AdminDashboard" element={<AdminDashboard/>}/>
         <Route path="/AdminManageSellers" element={<AdminManageSellers/>}/>
         <Route path="/DeleteProducts/:id" element={<DeleteProducts/>}/>
         <Route path="/DeleteServices/:id" element={<DeleteServices/>}/>
         <Route path="/DeleteAssets/:id" element={<DeleteAssets/>}/>
         <Route path="/AdminOrders" element={<AdminOrders/>}/>
      </Routes>
      </BrowserRouter>
      </HelmetProvider>
    </div>
  )
}

export default App;