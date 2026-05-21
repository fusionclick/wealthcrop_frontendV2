import { useEffect, useRef, useState } from "react";

export default function VideoKYC() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [status, setStatus] = useState("NOT_STARTED"); 
  // NOT_STARTED | CAMERA_ON | CAPTURED | VERIFIED

  // Start Camera
//   const startCamera = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { facingMode: "user" },
//         audio: false,
//       });

//       videoRef.current.srcObject = stream;
//       setCameraOn(true);
//       setStatus("CAMERA_ON");
//     } catch (err) {
//         console.log(err);
//       alert("Camera access denied");
//     }
//   };
const startCamera = async () => {
  try {
    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    const video = videoRef.current;
    video.srcObject = stream;
    await video.play();

    setCameraOn(true);
    setStatus("CAMERA_ON");
  } catch (err) {
    console.error("Camera error:", err.name, err.message);
    alert(err.name + ": " + err.message);
  }
};


  // Stop Camera
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setCameraOn(false);
  };

  // Capture Image
  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/png");
    setCapturedImage(imageData);
    setStatus("CAPTURED");
    stopCamera();
  };

  // Mock Verification
  const verifyKYC = () => {
    // simulate API delay
    setTimeout(() => {
      setStatus("VERIFIED");
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto mt-4 bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-blue-900 mb-4">
        Video KYC Verification
      </h2>

      {/* Instructions */}
      <ul className="text-sm text-gray-600 mb-4 list-disc pl-4">
        <li>Ensure good lighting</li>
        <li>Remove mask / cap</li>
        <li>Face the camera clearly</li>
      </ul>

      {/* Camera Preview */}
      {cameraOn && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full rounded-lg border"
        />
      )}

      {/* Captured Image */}
      {capturedImage && (
        <img
          src={capturedImage}
          alt="Captured"
          className="w-full rounded-lg border"
        />
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Buttons */}
      <div className="mt-4 flex gap-3">
        {status === "NOT_STARTED" && (
          <button
            onClick={startCamera}
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Start Camera
          </button>
        )}

        {status === "CAMERA_ON" && (
          <button
            onClick={captureImage}
            className="bg-green-600 text-white px-4 py-2 rounded-md"
          >
            Capture Image
          </button>
        )}

        {status === "CAPTURED" && (
          <button
            onClick={verifyKYC}
            className="bg-purple-600 text-white px-4 py-2 rounded-md"
          >
            Verify KYC
          </button>
        )}
      </div>

      {/* Status */}
      <div className="mt-4 text-sm">
        <strong>Status:</strong>{" "}
        {status === "VERIFIED" ? (
          <span className="text-green-600">KYC Completed ✔</span>
        ) : (
          <span className="text-gray-500">{status}</span>
        )}
      </div>
    </div>
  );
}
