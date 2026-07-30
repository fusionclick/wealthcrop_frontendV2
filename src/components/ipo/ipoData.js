// src/data/ipoData.js

/**
 * ------------------------------
 * 💡 REAL API STRUCTURE (example)
 * ------------------------------
 * 
 * {
 *   name: "Company IPO",
 *   logo: "https://...png",
 *   status: "listed" | "open" | "upcoming",
 * 
 *   listingDetails: {
 *     listedOn: "BSE",
 *     issuePrice: 135,
 *     listPrice: 145,
 *     listingGain: "7.4%"
 *   },
 * 
 *   ipoDetails: {
 *     biddingDates: "3 Feb - 5 Feb",
 *     minInvestment: "₹14,500",
 *     lotSize: 55,
 *     priceRange: "₹250 - ₹270",
 *     issueSize: "600 Cr",
 *     rhp: "https://rhp.pdf",
 *     allotmentDate: "09 Feb",
 *     listingDate: "12 Feb",
 *     faceValue: 10
 *   },
 * 
 *   about: {
 *     description: "...",
 *     founded: "1991",
 *     ceo: "Mr ABC XYZ",
 *     parent: "Parent Ltd",
 *     images: ["1.jpg","2.jpg","3.jpg","4.jpg"]
 *   }
 * }
 * 
 * Replace staticData[name] with API fetch later.
 */

// -------------------------
// 📌 STATIC IPO DATA (USE THIS FOR NOW)
// -------------------------

export const ipoStaticData = {
   
    name: "Vidya Wires IPO",
    logo: "/images/vidya-logo.png",

    status: "listed", // open | upcoming | listed

    minInvestment: 13824,
    shares: 288,

    listingDetails: {
      listedOn: "BSE",
      issuePrice: 52,
      listPrice: 52,
      listingGain: "0.00 (0.00%)"
    },

    ipoDetails: {
      biddingDates: "3 Dec ’25 - 5 Dec ’25",
      minInvestment: "₹13,824",
      lotSize: "288",
      priceRange: "₹48 - ₹52",
      issueSize: "300.01 Cr",
      rhp: "/pdf/vidya-wires-rhp.pdf",
      allotmentDate: "08 Dec ’25",
      listingDate: "10 Dec ’25",
      faceValue: "1"
    },

    about: {
      description:
        "Vidya Wires manufactures winding and conductivity products used across electrical, energy, mobility, and railway sectors.",
      founded: "1981",
      ceo: "Mr Shailesh Rathi",
      parent: "Vidya Wires Ltd",

      // 4 image placeholders
      images: [
        "/about/img1.jpg",
        "/about/img2.jpg",
        "/about/img3.jpg",
        "/about/img4.jpg"
      ]
    
  },

  // Add more IPOs here:
  // tataTech: { ... },
  // ideaForge: { ... }
};
