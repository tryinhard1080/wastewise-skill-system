"use client";

/**
 * API Documentation Page
 *
 * Interactive Swagger UI for exploring and testing the WasteWise API
 */

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the OpenAPI spec
    fetch("/api/openapi.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load API specification");
        }
        return res.json();
      })
      .then((data) => {
        setSpec(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading OpenAPI spec:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="mb-2 text-xl font-bold text-red-800">
            Error Loading Documentation
          </h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="mb-2 text-4xl font-bold">
            WasteWise API Documentation
          </h1>
          <p className="text-blue-100">
            Interactive API explorer for the WasteWise waste management
            optimization platform
          </p>
          <div className="mt-4 flex gap-4">
            <a
              href="/api/openapi.json"
              download="wastewise-openapi.json"
              className="rounded bg-white/20 px-4 py-2 text-sm hover:bg-white/30"
            >
              Download JSON
            </a>
            <a
              href="/"
              className="rounded bg-white/20 px-4 py-2 text-sm hover:bg-white/30"
            >
              Back to App
            </a>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="border-b bg-gray-50 py-6">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-2xl font-bold">Quick Start</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border bg-white p-4">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                1
              </div>
              <h3 className="mb-2 font-semibold">Authentication</h3>
              <p className="text-sm text-gray-600">
                Login to get a JWT token, then click the &quot;Authorize&quot;
                button above and enter:
                <code className="mt-2 block rounded bg-gray-100 p-2 text-xs">
                  Bearer &lt;your_token&gt;
                </code>
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                2
              </div>
              <h3 className="mb-2 font-semibold">Async Job Pattern</h3>
              <p className="text-sm text-gray-600">
                Most operations are async:
                <br />
                1. Create job → Get jobId
                <br />
                2. Poll status every 2s
                <br />
                3. Get results when completed
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                3
              </div>
              <h3 className="mb-2 font-semibold">Rate Limits</h3>
              <p className="text-sm text-gray-600">
                Users: 100 req/min
                <br />
                Admins: 500 req/min
                <br />
                Check headers: X-RateLimit-*
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Swagger UI */}
      {spec && (
        <SwaggerUI
          spec={spec}
          docExpansion="list"
          defaultModelsExpandDepth={1}
          displayRequestDuration={true}
          filter={true}
          showExtensions={true}
          showCommonExtensions={true}
          persistAuthorization={true}
          tryItOutEnabled={true}
          requestInterceptor={(request) => {
            // Add any custom headers here
            return request;
          }}
          onComplete={(system) => {
            console.log("Swagger UI loaded", system);
          }}
        />
      )}

      {/* Footer */}
      <div className="border-t bg-gray-50 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>
            WasteWise API v1.0.0 | Built with OpenAPI 3.0 | Generated with
            swagger-jsdoc
          </p>
          <p className="mt-2">
            <a
              href="https://wastewise.com/support"
              className="text-blue-600 hover:underline"
            >
              Support
            </a>
            {" | "}
            <a
              href="https://wastewise.com/terms"
              className="text-blue-600 hover:underline"
            >
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
