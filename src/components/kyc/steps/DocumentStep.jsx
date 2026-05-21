export default function DocumentStep({ next, prev, update }) {
  const upload = (e) => {
    update({ document: e.target.files[0] });
    next();
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Upload PAN / Aadhaar</h2>

      <input type="file" onChange={upload} />

      <div className="flex gap-3 mt-4">
        <button onClick={prev} className="w-1/2 border rounded-lg py-2">
          Back
        </button>
      </div>
    </>
  );
}
