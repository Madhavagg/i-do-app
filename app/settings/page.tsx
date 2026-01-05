'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface ApiKeyInfo {
  id: string;
  keyPrefix: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [apiKey, setApiKey] = useState<ApiKeyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRegenerateMode, setIsRegenerateMode] = useState(false); // true = regenerate, false = delete only
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing API key
  const fetchApiKey = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/mcp/keys');
      const data = await response.json();

      if (response.ok) {
        setApiKey(data.key);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to fetch API key');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      fetchApiKey();
    }
  }, [user, authLoading, router, fetchApiKey]);

  // Generate new API key
  const handleGenerateKey = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/mcp/keys', {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        setNewRawKey(data.rawKey);
        setApiKey(data.key);
        setShowNewKeyModal(true);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to generate API key');
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete API key
  const handleDeleteKey = async () => {
    if (!apiKey) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/mcp/keys?id=${apiKey.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (response.ok) {
        setApiKey(null);
        setShowDeleteConfirm(false);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to delete API key');
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy key to clipboard
  const handleCopyKey = async () => {
    if (!newRawKey) return;

    try {
      await navigator.clipboard.writeText(newRawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  // Close modal and clear raw key
  const handleCloseModal = () => {
    setShowNewKeyModal(false);
    setNewRawKey(null);
  };

  // Handle delete button click (delete only)
  const handleDeleteClick = () => {
    setIsRegenerateMode(false);
    setShowDeleteConfirm(true);
  };

  // Handle regenerate button click (delete + generate new)
  const handleRegenerateClick = () => {
    setIsRegenerateMode(true);
    setShowDeleteConfirm(true);
  };

  // Confirm delete/regenerate action
  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    await handleDeleteKey();

    // Only generate new key if in regenerate mode
    if (isRegenerateMode) {
      await handleGenerateKey();
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Mask API key prefix
  const maskKey = (prefix: string) => {
    return prefix + '••••••••••••••••';
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* MCP Integration Section */}
        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">MCP Integration</h2>
            <p className="text-sm text-gray-600 mt-1">
              Connect AI assistants like Claude, Cursor, or ChatGPT to create tasks directly in your I do app.
            </p>
          </div>

          <div className="px-6 py-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {apiKey ? (
              // Existing key display
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-gray-200 px-2 py-1 rounded">
                        {maskKey(apiKey.keyPrefix)}
                      </code>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Created {formatDate(apiKey.createdAt)}
                      {apiKey.lastUsedAt && ` • Last used ${formatDate(apiKey.lastUsedAt)}`}
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <a
                    href="/docs/mcp-setup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                  >
                    Learn how to connect your AI assistant
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <button
                    onClick={handleRegenerateClick}
                    disabled={isGenerating}
                    className="text-sm text-gray-600 hover:text-gray-700"
                  >
                    Regenerate key
                  </button>
                </div>
              </div>
            ) : (
              // No key - show generate button
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No API Key</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Generate an API key to connect AI assistants to your tasks.
                </p>
                <button
                  onClick={handleGenerateKey}
                  disabled={isGenerating}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate API Key'
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-4">
                  <a
                    href="/docs/mcp-setup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Learn how to connect your AI assistant →
                  </a>
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* New Key Modal */}
      {showNewKeyModal && newRawKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Your API Key</h3>
            </div>
            <div className="px-6 py-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                <p className="text-amber-800 text-sm font-medium flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Save this key now. You won&apos;t be able to see it again!
                </p>
              </div>

              <div className="relative">
                <code className="block w-full p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-sm break-all">
                  {newRawKey}
                </code>
                <button
                  onClick={handleCopyKey}
                  className="absolute top-2 right-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <p className="text-sm text-gray-600 mt-4">
                Use this key in your AI assistant&apos;s MCP configuration. See the{' '}
                <a href="/docs/mcp-setup" target="_blank" className="text-blue-600 hover:underline">
                  setup guide
                </a>{' '}
                for instructions.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end rounded-b-xl">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                I&apos;ve saved my key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Regenerate Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {isRegenerateMode ? 'Regenerate API Key?' : 'Delete API Key?'}
              </h3>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-600">
                {isRegenerateMode ? (
                  <>
                    This will delete your existing API key and generate a new one.{' '}
                    <span className="font-medium text-red-600">
                      Any integrations using the current key will stop working until you update them with the new key.
                    </span>
                  </>
                ) : (
                  <>
                    This will permanently delete your API key.{' '}
                    <span className="font-medium text-red-600">
                      Any integrations using this key will immediately stop working.
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : isRegenerateMode ? 'Regenerate Key' : 'Delete Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
