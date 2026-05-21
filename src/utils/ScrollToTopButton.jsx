import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 250);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: "fixed",
        right: "40px",
        bottom: "105px",
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #4ade80, #0ea5e9)", // mint green → ocean blue
        border: "none",
        display: isVisible ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: "white",
        boxShadow: "0 8px 22px rgba(0, 0, 0, 0.22)", // soft premium shadow
        backdropFilter: "blur(4px)",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        zIndex: 999,
        transition: "transform 025s ease, box-shadow 0.25s ease"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.06)";
        e.currentTarget.style.boxShadow = "0 10px 26px rgba(14, 165, 233, 0.45)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 8px 22px rgba(0, 0, 0, 0.22)";
      }}
    >
      <ChevronUp size={28} strokeWidth={2.6} />
    </button>
  );
}

export default ScrollToTopButton;
