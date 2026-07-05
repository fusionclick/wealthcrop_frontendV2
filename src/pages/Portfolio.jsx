import React from "react";
import { Navigate } from "react-router-dom";

/** Portfolio hub — redirects to MF investments dashboard */
const Portfolio = () => {
  return <Navigate to="/user/mutual_fund/investments" replace />;
};

export default Portfolio;
