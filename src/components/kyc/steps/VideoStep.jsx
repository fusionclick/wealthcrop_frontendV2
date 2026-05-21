export default function VideoStep({ next, prev, update }) {
  const upload = (e) => {
    update({ video: e.target.files[0] });
    next();
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Video KYC</h2>

      <p className="text-sm text-gray-500 mb-3">
        Upload a short selfie video (5–10 seconds)
      </p>

      <input type="file" accept="video/*" onChange={upload} />

      <div className="flex gap-3 mt-4">
        <button onClick={prev} className="w-1/2 border rounded-lg py-2">
          Back
        </button>
      </div>
    </>
  );
}
