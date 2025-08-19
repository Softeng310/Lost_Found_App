import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { app } from "../firebase/config";
import { Bell, Map, ShieldCheck, Siren, GitBranch } from "lucide-react";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import "../App.css";

function NavLink({ href, label, icon }) {
  return (
    <Link
      to={href}
      className={cn(
        "text-sm rounded-md px-2 py-1 hover:bg-emerald-50 transition-colors inline-flex items-center gap-1"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

NavLink.propTypes = {
  href: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.node
};

export default function SignUpPage() {
  const db = getFirestore(app);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [profilePic, setProfilePic] = useState("");
    const [upi, setUpi] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
        // Add user to Firestore 'users' collection with all required fields
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          name: name,
          profilePic: profilePic,
          upi: upi,
          claimed_items: [],
          reported_items: [],
          createdAt: new Date().toISOString()
        });
      navigate("/");
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError("An account with this email already exists. Please sign in instead.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak. Please choose a stronger password.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Siren className="h-5 w-5 text-emerald-600" />
            <span className="hidden sm:inline">{"Lost & Found Community"}</span>
            <span className="sm:hidden">{"L&F"}</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 sm:gap-2">
            <NavLink href="/feed" label="Feed" />
            <NavLink href="/items/new" label="Report" />
            <NavLink href="/map" label="Map" icon={<Map className="h-4 w-4" />} />
            <NavLink href="/stats" label="Stats" />
            <NavLink href="/announcements" label="Notices" icon={<Bell className="h-4 w-4" />} />
            <NavLink href="/admin" label="Admin" />
            <NavLink href="/profile" label="Profile" icon={<ShieldCheck className="h-4 w-4" />} />
            <a href="https://github.com/Softeng310/Lost_Found_App.git" target="_blank" rel="noopener noreferrer" className="ml-1">
              <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                <GitBranch className="h-4 w-4" />
                {"Repo"}
              </Button>
            </a>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <form onSubmit={handleSignUp} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4">Create Account</h2>
          {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
            <div className="mb-4">
              <label htmlFor="name" className="block mb-1 text-sm font-medium">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block mb-1 text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="profilePic" className="block mb-1 text-sm font-medium">Profile Picture URL</label>
              <input
                id="profilePic"
                type="url"
                value={profilePic}
                onChange={(e) => setProfilePic(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="https://imgur.com/a/yourpic"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="upi" className="block mb-1 text-sm font-medium">UPI ID</label>
              <input
                id="upi"
                type="text"
                value={upi}
                onChange={(e) => setUpi(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="your-upi-id"
              />
            </div>
          <div className="mb-4">
            <label htmlFor="password" className="block mb-1 text-sm font-medium">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
              minLength={6}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full mb-4"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign In
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
