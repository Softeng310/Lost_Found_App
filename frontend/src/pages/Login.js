import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { Button } from "../components/ui/button";
import "../App.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      <main className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4">Login</h2>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="mb-4">
            <label htmlFor="login-email" className="block mb-1">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="login-password" className="block mb-1">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <Button type="submit" className="w-full mb-4">Login</Button>
          <div className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Create Account
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
