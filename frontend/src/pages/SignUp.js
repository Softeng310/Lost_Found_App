import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { app } from "../firebase/config";
import { Button } from "../components/ui/button";
import "../App.css";

export default function SignUpPage() {
  const db = getFirestore(app);
  
  // Form state - all the fields we need to collect
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [profilePicFile, setProfilePicFile] = useState(null); // For file upload
  const [upi, setUpi] = useState("");
  
  // UI state - loading and error handling
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false); // New: track upload status
  
  const navigate = useNavigate();
  const auth = getAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  // Handle file selection for profile picture
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, or WEBP)');
        return;
      }
      
      // Validate file size (2MB max)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        setError('Image must be less than 2MB');
        return;
      }
      
      setProfilePicFile(file);
      setError(""); // Clear any previous errors
    }
  };

  // Upload profile picture to backend
  const uploadProfilePicture = async () => {
    if (!profilePicFile) return null;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profilePic', profilePicFile);
      
      // Add timeout to prevent indefinite hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('http://localhost:5876/api/users/upload-profile-picture', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      
      const data = await response.json();
      return data.url; // Return the Cloudinary URL
    } catch (err) {
      console.error('Upload error:', err);
      
      // Handle different error types
      if (err.name === 'AbortError') {
        throw new Error('Upload timed out. Please check if the server is running and try again.');
      }
      if (err.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please make sure the backend is running on port 5876.');
      }
      
      throw new Error('Failed to upload profile picture: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle account creation
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation - check passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Firebase requires at least 6 characters
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      // Upload profile picture if a file was selected
      let uploadedImageUrl = "";
      
      if (profilePicFile) {
        try {
          uploadedImageUrl = await uploadProfilePicture();
        } catch (uploadErr) {
          setError(uploadErr.message);
          setLoading(false);
          return;
        }
      }
      
      // Create the Firebase auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Store additional user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        name: name,
        profilePic: uploadedImageUrl, // Use uploaded URL or provided URL
        upi: upi,
        role: "student", // Default role - can be manually changed to "staff" in Firebase console
        claimed_items: [], // Track items this user has claimed
        reported_items: [], // Track items this user has reported
        createdAt: new Date().toISOString()
      });
      
      navigate("/"); // Redirect to home on success
    } catch (err) {
      // Handle common Firebase auth errors with user-friendly messages
      if (err.code === 'auth/email-already-in-use') {
        setError("An account with this email already exists. Please sign in instead.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak. Please choose a stronger password.");
      } else {
        setError(err.message); // Fallback to Firebase error
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      <main className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        {/* Sign up form */}
        <form onSubmit={handleSignUp} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4">Create Account</h2>
          
          {/* Error display */}
          {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
          
          {/* Name field */}
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
          
          {/* Email field */}
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
          
          {/* Profile picture - optional file upload */}
          <div className="mb-4">
            <label htmlFor="profilePicFile" className="block mb-1 text-sm font-medium">Profile Picture (Optional)</label>
            <input
              id="profilePicFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              disabled={uploading || loading}
            />
            {profilePicFile && (
              <p className="text-xs text-emerald-600 mt-1">
                Selected: {profilePicFile.name}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Upload an image (JPEG, PNG, or WEBP, max 2MB)
            </p>
          </div>
          
          {/* UPI ID for payments - optional */}
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
          
          {/* Password field */}
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
          
          {/* Confirm password field */}
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
          
          {/* Submit button with loading state */}
          <Button 
            type="submit" 
            className="w-full mb-4"
            disabled={loading || uploading}
          >
            {uploading ? "Uploading Image..." : loading ? "Creating Account..." : "Create Account"}
          </Button>
          
          {/* Login link for existing users */}
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
