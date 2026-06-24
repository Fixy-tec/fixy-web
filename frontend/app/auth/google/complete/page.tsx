import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import GoogleCompleteView from "@/src/views/auth/googleCompleteView";

export default function GoogleCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a4ca3]" />
        </div>
      }
    >
      <GoogleCompleteView />
    </Suspense>
  );
}
