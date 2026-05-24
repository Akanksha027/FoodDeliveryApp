"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";

function RedirectHandler() {
  const [status, setStatus] = useState("Redirecting you back to the application...");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const mobileRedirect = urlParams.get("mobileRedirect");

      if (mobileRedirect) {
        // Construct the full deep link with the hash fragment (containing access_token, etc.)
        const hash = window.location.hash;
        const targetUrl = mobileRedirect + (hash ? `#${hash.substring(1)}` : "");
        
        console.log("Redirecting to mobile deep link:", targetUrl);
        setStatus("Authentication captured successfully! Opening application...");
        
        // Short delay to ensure browser loads and opens deep link cleanly
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 800);
      }
    }
  }, []);

  return (
    <p className="max-w-md text-lg leading-8 text-indigo-600 font-semibold animate-pulse dark:text-indigo-400">
      {status}
    </p>
  );
}

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("mobileRedirect")) {
        setIsMobile(true);
      }
    }
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
      <main className="flex w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black rounded-2xl shadow-xl border border-zinc-100 sm:items-start">
        <Image
          className="dark:invert mb-8"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        
        {isMobile ? (
          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left my-8 w-full">
            <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              🔒 Google Authentication
            </h1>
            <Suspense fallback={<p>Processing redirect...</p>}>
              <RedirectHandler />
            </Suspense>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
              <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
                To get started, edit the page.tsx file.
              </h1>
              <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                Looking for a starting point or more instructions? Head over to{" "}
                <a
                  href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                  className="font-medium text-zinc-950 dark:text-zinc-50"
                >
                  Templates
                </a>{" "}
                or the{" "}
                <a
                  href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                  className="font-medium text-zinc-950 dark:text-zinc-50"
                >
                  Learning
                </a>{" "}
                center.
              </p>
            </div>
            <div className="flex flex-col gap-4 text-base font-medium sm:flex-row mt-6">
              <a
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
                href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  className="dark:invert"
                  src="/vercel.svg"
                  alt="Vercel logomark"
                  width={16}
                  height={16}
                />
                Deploy Now
              </a>
              <a
                className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
                href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentation
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
