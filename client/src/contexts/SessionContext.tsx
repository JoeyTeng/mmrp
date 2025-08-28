"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { initSession } from "@/services/sessionService";
import { toast } from "react-toastify/unstyled";
import Loading from "@/components/layout/Loading";

type SessionContextType = {
  sessionId: string | null;
  isSessionReady: boolean;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);

  const initUserSession = async () => {
    try {
      const session_id = await initSession();
      setSessionId(session_id);
      setIsSessionReady(true);
    } catch (err) {
      console.log("Error initializing session:", err);
      toast.error("Failed to initialize session");
    }
  };

  useEffect(() => {
    initUserSession();
  }, []);

  if (!sessionId && !isSessionReady) {
    return <Loading />;
  }

  return (
    <SessionContext value={{ sessionId, isSessionReady }}>
      {children}
    </SessionContext>
  );
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be inside SessionProvider");
  return ctx;
};
