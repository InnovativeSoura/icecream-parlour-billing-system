const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

export const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        resolve(true);
      });

      existingScript.addEventListener("error", () => {
        resolve(false);
      });

      return;
    }

    const script = document.createElement("script");

    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      console.error("Failed to load Razorpay Checkout SDK.");
      resolve(false);
    };

    document.body.appendChild(script);
  });
};
