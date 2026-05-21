export default {
  0: {
    name: "Wealth Builder Bluechip MF Basket",

    navHistory: [100, 102, 101, 105, 108, 110, 113],

    metrics: {
      sharpe: 1.4,
      expenseRatio: 0.85,
      stdDev: 12.5,
      beta: 0.92,
      maxDrawdown: -11.8,
    },

    rolling: {
      rolling1Y: 10.5,
      rolling3Y: 11.8,
      rolling5Y: 12.9,
    },

    allocation: {
      equity: 70,
      debt: 20,
      commodity: 10,
    },

    funds: [
      {
        category: "Equity",
        list: [
          {
            name: "Axis Bluechip Fund",
            weight: 30,
            returns1Y: 11.8,
            returns3Y: 14.2,
            returns5Y: 15.3,
            rating: 4,
          },
          {
            name: "Mirae Large Cap Fund",
            weight: 40,
            returns1Y: 12.5,
            returns3Y: 15.1,
            returns5Y: 16.4,
            rating: 5,
          },
        ],
      },
      {
        category: "Debt",
        list: [
          {
            name: "HDFC Short Term Fund",
            weight: 20,
            returns1Y: 6.4,
            returns3Y: 7.8,
            returns5Y: 8.1,
            rating: 4,
          },
        ],
      },
      {
        category: "Commodity",
        list: [
          {
            name: "Kotak Gold ETF",
            weight: 10,
            returns1Y: 9.2,
            returns3Y: 11.2,
            returns5Y: 12.4,
            rating: 3,
          },
        ],
      },
    ],
  },

  // ============================
  // BASKET 2
  // ============================

  1: {
    name: "Balanced Hybrid Growth Basket",

    navHistory: [100, 101, 103, 104, 106, 108, 109],

    metrics: {
      sharpe: 1.1,
      expenseRatio: 0.65,
      stdDev: 9.8,
      beta: 0.78,
      maxDrawdown: -8.6,
    },

    rolling: {
      rolling1Y: 8.2,
      rolling3Y: 9.7,
      rolling5Y: 10.4,
    },

    allocation: {
      equity: 50,
      debt: 40,
      commodity: 10,
    },

    funds: [
      {
        category: "Equity",
        list: [
          {
            name: "ICICI Prudential Balanced Advantage Fund",
            weight: 25,
            returns1Y: 10.1,
            returns3Y: 12.0,
            returns5Y: 13.5,
            rating: 4,
          },
          {
            name: "HDFC Hybrid Equity Fund",
            weight: 25,
            returns1Y: 9.3,
            returns3Y: 11.1,
            returns5Y: 12.2,
            rating: 4,
          },
        ],
      },
      {
        category: "Debt",
        list: [
          {
            name: "SBI Corporate Bond Fund",
            weight: 40,
            returns1Y: 6.0,
            returns3Y: 7.1,
            returns5Y: 7.8,
            rating: 4,
          },
        ],
      },
      {
        category: "Commodity",
        list: [
          {
            name: "Axis Gold Fund",
            weight: 10,
            returns1Y: 8.8,
            returns3Y: 10.6,
            returns5Y: 11.4,
            rating: 3,
          },
        ],
      },
    ],
  },

  // ============================
  // BASKET 3
  // ============================

  2: {
    name: "Thematic EV + Technology Basket",

    navHistory: [100, 103, 107, 109, 112, 117, 120],

    metrics: {
      sharpe: 1.6,
      expenseRatio: 0.95,
      stdDev: 15.1,
      beta: 1.12,
      maxDrawdown: -14.2,
    },

    rolling: {
      rolling1Y: 13.8,
      rolling3Y: 15.9,
      rolling5Y: 17.1,
    },

    allocation: {
      equity: 90,
      debt: 5,
      commodity: 5,
    },

    funds: [
      {
        category: "Thematic Equity",
        list: [
          {
            name: "Nippon India EV & New Age Mobility Fund",
            weight: 40,
            returns1Y: 18.4,
            returns3Y: 20.1,
            returns5Y: 22.8,
            rating: 5,
          },
          {
            name: "ICICI Technology Fund",
            weight: 30,
            returns1Y: 16.2,
            returns3Y: 18.4,
            returns5Y: 19.7,
            rating: 4,
          },
        ],
      },
      {
        category: "Debt",
        list: [
          {
            name: "HDFC Ultra Short Duration Fund",
            weight: 5,
            returns1Y: 5.1,
            returns3Y: 6.4,
            returns5Y: 6.9,
            rating: 4,
          },
        ],
      },
      {
        category: "Commodity",
        list: [
          {
            name: "DSP World Gold Fund",
            weight: 5,
            returns1Y: 10.4,
            returns3Y: 12.6,
            returns5Y: 13.5,
            rating: 4,
          },
        ],
      },
    ],
  },
  3: {
    name: "Thematic EV + Technology Basket",

    navHistory: [100, 103, 107, 109, 112, 117, 120],

    metrics: {
      sharpe: 1.6,
      expenseRatio: 0.95,
      stdDev: 15.1,
      beta: 1.12,
      maxDrawdown: -14.2,
    },

    rolling: {
      rolling1Y: 13.8,
      rolling3Y: 15.9,
      rolling5Y: 17.1,
    },

    allocation: {
      equity: 90,
      debt: 5,
      commodity: 5,
    },

    funds: [
      {
        category: "Thematic Equity",
        list: [
          {
            name: "Nippon India EV & New Age Mobility Fund",
            weight: 40,
            returns1Y: 18.4,
            returns3Y: 20.1,
            returns5Y: 22.8,
            rating: 5,
          },
          {
            name: "ICICI Technology Fund",
            weight: 30,
            returns1Y: 16.2,
            returns3Y: 18.4,
            returns5Y: 19.7,
            rating: 4,
          },
        ],
      },
      {
        category: "Debt",
        list: [
          {
            name: "HDFC Ultra Short Duration Fund",
            weight: 5,
            returns1Y: 5.1,
            returns3Y: 6.4,
            returns5Y: 6.9,
            rating: 4,
          },
        ],
      },
      {
        category: "Commodity",
        list: [
          {
            name: "DSP World Gold Fund",
            weight: 5,
            returns1Y: 10.4,
            returns3Y: 12.6,
            returns5Y: 13.5,
            rating: 4,
          },
        ],
      },
    ],
  },
  4: {
    name: "Thematic EV + Technology Basket",

    navHistory: [100, 103, 107, 109, 112, 117, 120],

    metrics: {
      sharpe: 1.6,
      expenseRatio: 0.95,
      stdDev: 15.1,
      beta: 1.12,
      maxDrawdown: -14.2,
    },

    rolling: {
      rolling1Y: 13.8,
      rolling3Y: 15.9,
      rolling5Y: 17.1,
    },

    allocation: {
      equity: 90,
      debt: 5,
      commodity: 5,
    },

    funds: [
      {
        category: "Thematic Equity",
        list: [
          {
            name: "Nippon India EV & New Age Mobility Fund",
            weight: 40,
            returns1Y: 18.4,
            returns3Y: 20.1,
            returns5Y: 22.8,
            rating: 5,
          },
          {
            name: "ICICI Technology Fund",
            weight: 30,
            returns1Y: 16.2,
            returns3Y: 18.4,
            returns5Y: 19.7,
            rating: 4,
          },
        ],
      },
      {
        category: "Debt",
        list: [
          {
            name: "HDFC Ultra Short Duration Fund",
            weight: 5,
            returns1Y: 5.1,
            returns3Y: 6.4,
            returns5Y: 6.9,
            rating: 4,
          },
        ],
      },
      {
        category: "Commodity",
        list: [
          {
            name: "DSP World Gold Fund",
            weight: 5,
            returns1Y: 10.4,
            returns3Y: 12.6,
            returns5Y: 13.5,
            rating: 4,
          },
        ],
      },
    ],
  },
};
