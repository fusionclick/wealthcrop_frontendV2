/**
 * One row in a header mega-menu: icon, title, one-line description.
 *
 * This was defined four times — byte-identical copies in StocksMenu, FOMenu,
 * MutualFundsMenu and MoreMenu — so a styling change had to be made four times or the
 * menus drifted apart.
 */
export default function MenuItem({ icon: Icon, title, desc, onClick }) {
  return (
    <div
      onClick={onClick}
      className="
        flex gap-3 p-2 rounded-lg cursor-pointer transition
        hover:bg-blue-50/70 dark:hover:bg-white/5
      "
    >
      <Icon size={18} className="mt-1 text-blue-700 dark:text-blue-400" />
      <div>
        <p className="font-medium text-blue-950 dark:text-gray-100">{title}</p>
        <p className="text-xs text-slate-500 dark:text-gray-400">{desc}</p>
      </div>
    </div>
  );
}
