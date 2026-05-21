import React, { useEffect, useRef } from "react";
import { Bookmark, Plus } from "lucide-react";

const WatchlistPopup = ({ onClose }) => {
  const containerRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const watchList = [
    { id: 1, name: "watchlist 1", quantity: 10 },
    { id: 2, name: "watchlist 2", quantity: 4 },
    { id: 3, name: "watchlist 3", quantity: 2 },
  ];

  const handleSelectWatchlist = (item) => {
    console.log("Selected:", item);
  };

  const handleCreateNew = () => {
    console.log("Create new watchlist");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[9999] px-4">

      {/* Popup box */}
      <div
        ref={containerRef}
        className="w-full max-w-xl p-6 rounded-2xl shadow-xl 
        bg-white dark:bg-[#020617] 
        border border-gray-200 dark:border-white/10
        translate-y-[-30px] 
        "
      >
        <h2 className="text-xl font-semibold mb-5 text-blue-950 dark:text-gray-100">
          Add stocks to
        </h2>

        <div className="space-y-3">
          {watchList.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelectWatchlist(item)}
              className="flex justify-between items-center p-3 rounded-lg cursor-pointer
              hover:bg-gray-100 dark:hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-4">

                <h1 className="text-sm font-semibold capitalize text-blue-900 dark:text-gray-200">
                  {item.name}
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.quantity}
                </span>

               
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Bookmark clicked", item);
                  }}
                  className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-white/10"
                >
                  <Bookmark
                    size={18}
                    className="text-blue-900 dark:text-gray-300"
                  />
                </button>
              </div>
            </div>
          ))}

          {/* CREATE NEW WATCHLIST */}
          <div
            onClick={handleCreateNew}
            className="flex items-center justify-between p-3 rounded-lg cursor-pointer
            border border-dashed border-gray-300 dark:border-white/20
            hover:bg-gray-100 dark:hover:bg-white/5 transition"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-md 
              border border-gray-300 dark:border-white/20">
                <Plus className="text-blue-900 dark:text-gray-300" size={18} />
              </div>

              <span className="text-sm font-semibold text-blue-900 dark:text-gray-200">
                Create new watchlist
              </span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default WatchlistPopup;