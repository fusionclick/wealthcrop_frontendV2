// ProgressBar.jsx
const ProgressBar = ({ current, total }) => {
  const percent = ((current + 1) / total) * 100;

  return (
    <div className="w-full mb-8">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-sm text-gray-500 mt-2">
        Question {current + 1} of {total}
      </p>
    </div>
  );
};

export default ProgressBar;
