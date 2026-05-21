const SmallLoader = () => {
  return (
    <div className="h-10 flex items-center justify-center bg-[var(--app-bg)]">
      <div className="w-10 h-10 border-4 border-[var(--border-color)] border-t-blue-800 dark:border-t-white rounded-full animate-spin"></div>
    </div>
  );
};

export default SmallLoader;