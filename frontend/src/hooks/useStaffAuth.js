import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

/**
 * Custom hook to check if user is authenticated and has staff role
 * Redirects non-staff users to appropriate pages
 */
export const useStaffAuth = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const role = userDoc.data().role;
            setUserRole(role);
            // Redirect if not staff
            if (role !== "staff") {
              navigate("/announcements");
            }
          } else {
            navigate("/announcements");
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
          navigate("/announcements");
        }
      } else {
        // Redirect if not logged in
        navigate("/login");
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [auth, navigate]);

  return { currentUser, userRole, loading, isStaff: userRole === "staff" };
};
