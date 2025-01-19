// app/page.tsx
import Hero from "@/components/hero";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Hero />
      <div className="pt-4  flex flex-col items-center gap-8">
        {/* Chat Preview */}
        <div className="w-full max-w-3xl mt-8 rounded-lg border border-foreground/10 p-4 bg-muted/50">
          <div className="text-center text-sm text-muted-foreground">
            Sign in to start chatting
          </div>
          <div className="mt-4 space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                👨‍🦱
              </div>
              <div className="flex-1 p-4 rounded-lg bg-muted">
                Tell me about artificial intelligence
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                🤖
              </div>
              <div className="flex-1 p-4 rounded-lg bg-background border border-foreground/10">
                Artificial Intelligence (AI) refers to computer systems that can
                perform tasks...
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
