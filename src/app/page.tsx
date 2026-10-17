"use client";

import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import UnifiedWorkspace from "@/components/workspace/UnifiedWorkspace";
import { LogIn } from "lucide-react";

export default function Home() {
  const { user, loading, authError, loginWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-sm w-full text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Tasknotes</h1>
          <p className="text-gray-500 mb-6">Your all-in-one productivity workspace.</p>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs text-left rounded-md flex flex-col gap-1">
              <span className="font-semibold">Sign-in Notice:</span>
              <span>{authError}</span>
            </div>
          )}

          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <LogIn className="w-5 h-5 mr-2 text-gray-500" />
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  // All-in-One Command Center Screen
  return (
    <AppLayout noPadding={true}>
      <UnifiedWorkspace />
    </AppLayout>
  );
}
