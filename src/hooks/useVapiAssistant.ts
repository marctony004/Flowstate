import { useEffect, useState } from "react";
import Vapi from "@vapi-ai/web";

// You can find this public key in your Vapi Dashboard
const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY || "YOUR_VAPI_PUBLIC_KEY_HERE";
// Service URL for the assistant (can be overridden or set in Vapi dashboard)
// For this implementation, we assume the assistant is configured in Vapi Dashboard to point to our Edge Function.
const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID || "YOUR_ASSISTANT_ID_HERE";

const vapi = new Vapi(VAPI_PUBLIC_KEY);

export enum VapiStatus {
    LOADING = "loading",
    IDLE = "idle",
    CONNECTING = "connecting",
    ACTIVE = "active",
    ERROR = "error",
}

export const useVapiAssistant = (userId: string) => {
    const [status, setStatus] = useState<VapiStatus>(VapiStatus.IDLE);
    const [isSpeechActive, setIsSpeechActive] = useState(false);
    const [volumeLevel, setVolumeLevel] = useState(0);
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        // Event listeners
        const onCallStart = () => setStatus(VapiStatus.ACTIVE);
        const onCallEnd = () => {
            setStatus(VapiStatus.IDLE);
            setIsSpeechActive(false);
            setVolumeLevel(0);
            setMessages([]); // Optional: clear messages on call end or keep them
        };
        const onSpeechStart = () => setIsSpeechActive(true);
        const onSpeechEnd = () => setIsSpeechActive(false);
        const onVolumeLevel = (volume: number) => setVolumeLevel(volume);
        const onError = (error: any) => {
            console.error("Vapi error:", error);
            setStatus(VapiStatus.ERROR);
        };

        const onMessage = (message: any) => {
            if (message.type === "transcript" && message.transcriptType === "final") {
                setMessages((prev) => [...prev, {
                    role: message.role,
                    content: message.transcript,
                    timestamp: new Date().toISOString()
                }]);
            }
        };

        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("speech-start", onSpeechStart);
        vapi.on("speech-end", onSpeechEnd);
        vapi.on("volume-level", onVolumeLevel);
        vapi.on("message", onMessage);
        vapi.on("error", onError);

        return () => {
            vapi.stop();
            vapi.removeAllListeners();
        };
    }, []);

    const toggleCall = async () => {
        if (status === VapiStatus.ACTIVE || status === VapiStatus.CONNECTING) {
            vapi.stop();
        } else {
            setStatus(VapiStatus.CONNECTING);
            try {
                await vapi.start(VAPI_ASSISTANT_ID, {
                    metadata: {
                        user_id: userId
                    }
                });
            } catch (err) {
                console.error("Failed to start Vapi call", err);
                setStatus(VapiStatus.ERROR);
            }
        }
    };

    return {
        status,
        isSpeechActive,
        volumeLevel,
        messages,
        toggleCall,
        vapi
    };
};
