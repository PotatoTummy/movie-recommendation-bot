"use client";

import React, { useState } from "react";
import { VoiceRoom } from "@/components/VoiceRoom";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const startVoiceSession = async () => {
    if (token) return;
    setIsConnecting(true);
    try {
      const sessionRoom = `cinebot-${Math.random().toString(36).substring(2, 9)}`;
      const res = await fetch(`/api/token?room=${sessionRoom}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch LiveKit room token");
      }
      setToken(data.token);
      setServerUrl(data.url);
    } catch (err) {
      console.error("Connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setToken(null);
    setServerUrl(null);
  };

  return (
    <VoiceRoom
      token={token}
      serverUrl={serverUrl}
      isConnecting={isConnecting}
      onConnect={startVoiceSession}
      onDisconnect={handleDisconnect}
    />
  );
}
