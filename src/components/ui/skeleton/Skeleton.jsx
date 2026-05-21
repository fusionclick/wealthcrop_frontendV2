const Skeleton = ({ className = "" }) => {
  return (
    <div
      className={`
        animate-pulse
        bg-gray-200 dark:bg-gray-700
        rounded-md
        ${className}
      `}
    />
  );
};

export default Skeleton;