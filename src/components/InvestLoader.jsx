const InvestLoader = () => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] rounded-2xl">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-white/30 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-white">
          Placing your order...
        </p>
      </div>
    </div>
  );
};

export default InvestLoader;