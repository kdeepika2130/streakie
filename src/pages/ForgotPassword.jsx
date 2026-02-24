import React from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 px-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 text-center border border-purple-200/50 shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-purple-600 mb-4">Forgot Password</h2>
        <p className="text-gray-600 mb-6">This feature is coming soon. Please contact support or try logging in.</p>
        <Link
          to="/login"
          className="inline-block bg-gradient-to-r from-pink-500 to-yellow-400 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
