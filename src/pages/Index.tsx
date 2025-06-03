import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { POSStore } from "@/lib/store";

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize the store
    POSStore.initializeStore();

    // Check if user is logged in
    const currentUser = POSStore.getCurrentUser();

    if (currentUser) {
      // If logged in, redirect to dashboard (which is the same as this route in App.tsx)
      // This component shouldn't actually be reached due to the route setup
      navigate("/", { replace: true });
    } else {
      // If not logged in, redirect to login
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // This component renders nothing as it's just a redirect
  return null;
}
