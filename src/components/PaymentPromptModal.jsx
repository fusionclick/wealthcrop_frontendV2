import { X, CreditCard, Clock3 } from "lucide-react";
import { useEffect } from "react";

export default function PaymentPromptModal({
  open,
  onClose,
  linkLoading,
  paymentLink,
  onSkip,
}) {
  if (!open) return null;


  //  useEffect(() => {
  //    document.body.style.overflow = "hidden";

  //    return () => {
  //      document.body.style.overflow = "auto";
  //    };
  //  }, []);


  const Loader = () => (
    <div className="flex justify-center">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
    </div>
  );

  return (
    <div
      className="
        fixed inset-0 z-[99999] 
        flex items-center justify-center
        bg-black/50 backdrop-blur-sm
        px-4
      "
    >
      <div
        className="
          w-full max-w-md
          rounded-3xl
          bg-white
          shadow-2xl
          overflow-hidden

          dark:bg-[var(--card-bg)]
          dark:border
          dark:border-[var(--border-color)]
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-[var(--border-color)]">
          <h2 className="font-semibold text-lg dark:text-[var(--text-primary)]">
            Complete Payment
          </h2>

          <button
            onClick={onClose}
            className="
              p-2 rounded-full
              hover:bg-gray-100
              dark:hover:bg-[var(--gray-800)]
            "
          >
            <X className="w-5 h-5 dark:text-[var(--text-primary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div
            className="
              w-16 h-16 mx-auto mb-5
              rounded-full
              bg-green-100
              flex items-center justify-center
            "
          >
            <CreditCard className="w-8 h-8 text-green-600" />
          </div>

          <h3
            className="
              text-center
              text-xl
              font-semibold
              mb-2

              dark:text-[var(--text-primary)]
            "
          >
            Order Created Successfully
          </h3>

          <p
            className="
              text-center
              text-sm
              text-gray-500
              mb-6

              dark:text-[var(--text-secondary)]
            "
          >
            Your order has been submitted successfully. Complete the payment now
            to process your investment.
          </p>

          {/* Info Box */}
          <div
            className="
              rounded-2xl
              border border-amber-200
              bg-amber-50
              p-4
              mb-6

              dark:bg-amber-500/10
              dark:border-amber-500/20
            "
          >
            <div className="flex gap-3">
              <Clock3 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />

              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Payment Pending
                </p>

                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                  You can complete the payment later from the Orders section,
                  but the order will not be processed until payment is received.
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onSkip}
              className="
                flex-1
                py-3
                rounded-xl
                border border-gray-300
                text-sm font-medium

                hover:bg-gray-50

                dark:border-[var(--border-color)]
                dark:text-[var(--text-primary)]
                dark:hover:bg-[var(--gray-800)]
              "
            >
              {linkLoading ? <Loader /> : "Skip for Now"}
            </button>

            <button
              //   onClick={onProceed}
              onClick={() => {
                const w = window.open(paymentLink, "_blank");
                console.log("window", w);
              }}
              className="
                flex-1
                py-3
                rounded-xl
                text-sm font-medium
                text-white

                bg-green-600
                hover:bg-green-700

                shadow-lg
                shadow-green-600/20
              "
            >
              {linkLoading ? <Loader /> : "Proceed to Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}