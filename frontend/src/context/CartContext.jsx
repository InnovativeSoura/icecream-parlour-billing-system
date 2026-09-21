import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

const CART_KEY = "icecream_cart";

const GST_RATE = 0.05;

const getStoredCart = () => {
  try {
    const storedCart = localStorage.getItem(CART_KEY);

    if (!storedCart) {
      return [];
    }

    const parsedCart = JSON.parse(storedCart);

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    return parsedCart
      .filter((item) => item && item._id)
      .map((item) => ({
        ...item,
        quantity: Math.max(1, Number(item.quantity) || 1),
      }));
  } catch (error) {
    console.error("Failed to load cart from localStorage:", error);

    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    return getStoredCart();
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cartItems));

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  }, [cartItems]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== CART_KEY) {
        return;
      }

      setCartItems(getStoredCart());
    };

    const handleCartUpdated = () => {
      const storedCart = getStoredCart();

      setCartItems((currentCart) => {
        const currentJSON = JSON.stringify(currentCart);

        const storedJSON = JSON.stringify(storedCart);

        if (currentJSON === storedJSON) {
          return currentCart;
        }

        return storedCart;
      });
    };

    window.addEventListener("storage", handleStorageChange);

    window.addEventListener("cartUpdated", handleCartUpdated);

    return () => {
      window.removeEventListener("storage", handleStorageChange);

      window.removeEventListener("cartUpdated", handleCartUpdated);
    };
  }, []);

  const addToCart = useCallback((product) => {
    if (!product || !product._id) {
      console.error("Cannot add invalid product to cart.");
      return;
    }

    setCartItems((currentCart) => {
      const existingItem = currentCart.find((item) => item._id === product._id);

      if (existingItem) {
        return currentCart.map((item) =>
          item._id === product._id
            ? {
                ...item,
                quantity: Number(item.quantity || 1) + 1,
              }
            : item,
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    if (!id) {
      return;
    }

    setCartItems((currentCart) =>
      currentCart.filter((item) => item._id !== id),
    );
  }, []);

  const increaseQuantity = useCallback((id) => {
    if (!id) {
      return;
    }

    setCartItems((currentCart) =>
      currentCart.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity: Number(item.quantity || 1) + 1,
            }
          : item,
      ),
    );
  }, []);

  const decreaseQuantity = useCallback((id) => {
    if (!id) {
      return;
    }

    setCartItems((currentCart) =>
      currentCart.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity: Math.max(1, Number(item.quantity || 1) - 1),
            }
          : item,
      ),
    );
  }, []);

  const setQuantity = useCallback((id, quantity) => {
    if (!id) {
      return;
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isFinite(parsedQuantity)) {
      return;
    }

    setCartItems((currentCart) =>
      currentCart.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity: Math.max(1, Math.floor(parsedQuantity)),
            }
          : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const totalItems = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + Math.max(1, Number(item.quantity) || 1),
      0,
    );
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = Number(item.price) || 0;
      const quantity = Math.max(1, Number(item.quantity) || 1);

      return total + price * quantity;
    }, 0);
  }, [cartItems]);

  const gst = useMemo(() => {
    return subtotal * GST_RATE;
  }, [subtotal]);

  const grandTotal = useMemo(() => {
    return subtotal + gst;
  }, [subtotal, gst]);

  const formattedSubtotal = useMemo(() => {
    return subtotal.toFixed(2);
  }, [subtotal]);

  const formattedGst = useMemo(() => {
    return gst.toFixed(2);
  }, [gst]);

  const formattedGrandTotal = useMemo(() => {
    return grandTotal.toFixed(2);
  }, [grandTotal]);

  const value = useMemo(
    () => ({
      cartItems,

      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      setQuantity,
      clearCart,

      totalItems,

      subtotal,
      gst,
      grandTotal,

      formattedSubtotal,
      formattedGst,
      formattedGrandTotal,

      gstRate: GST_RATE,
    }),
    [
      cartItems,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      setQuantity,
      clearCart,
      totalItems,
      subtotal,
      gst,
      grandTotal,
      formattedSubtotal,
      formattedGst,
      formattedGrandTotal,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
};

export default CartContext;
