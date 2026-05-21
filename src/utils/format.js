export const formatRupee = (num) =>
  "₹" + num.toLocaleString("en-IN");

export const formatPercent = (num) => num + "%";

export const formatAverage = (num) => num % 5;


export const formatDate = (dateString) => {
  if(!dateString) return

  return new Date(dateString).toLocaleString("en-IN",{
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
}

export const formatCustom = (dateString) => {
  const d = new Date(dateString);

  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleString("en-IN", { month: "short" });
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};