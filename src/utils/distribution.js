export function calculateDistribution(amount, funds) {
  let result = [];

  funds.forEach((category) => {
    category.list.forEach((fund) => {
      const invested = (amount * fund.weight) / 100;
      result.push({
        name: fund.name,
        amount: invested.toFixed(2),
        weight: fund.weight,
      });
    });
  });

  return result;
}

export function calculateDistribution2 (amount, baskets) {
    let total = [];

    baskets.forEach((category) => {
        const average = (amount / category.baskets);
        total.push({
            name: category.name,
            amount: average.toFixed(2),
            weight: category.weight
        })
    })

}
