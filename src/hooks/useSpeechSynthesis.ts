/**
 * Speech Synthesis Hook
 *
 * Uses the Web Speech API for voice output (text-to-speech).
 * Falls back gracefully if not supported.
 */

import { useState, useEffect, useCallback, useRef } from "react";

interface UseSpeechSynthesisOptions {
  voice?: SpeechSynthesisVoice | null;
  rate?: number; // 0.1 to 10, default 1
  pitch?: number; // 0 to 2, default 1
  volume?: number; // 0 to 1, default 1
  onEnd?: () => void;
  onError?: (error: string) => void;
}

interface UseSpeechSynthesisReturn {
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
}

export function useSpeechSynthesis(
  options: UseSpeechSynthesisOptions = {}
): UseSpeechSynthesisReturn {
  const {
    voice = null,
    rate = 0.92, // Slightly slower for more natural feel
    pitch = 1.02, // Tiny pitch variation
    volume = 1,
    onEnd,
    onError,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check support and load voices
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    // Load voices (may be async in some browsers)
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Select voice (prefer natural-sounding English voices)
      if (voice) {
        utterance.voice = voice;
      } else {
        const preferredVoice = getPreferredVoice(voices);
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        onEnd?.();
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
        setIsSpeaking(false);
        setIsPaused(false);
        onError?.(event.error);
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, voice, voices, rate, pitch, volume, onEnd, onError]
  );

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
  }, [isSupported]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [isSupported]);

  return {
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    speak,
    pause,
    resume,
    cancel,
  };
}

/**
 * Get a good default voice for English
 * Prioritizes natural/neural voices for better quality
 */
export function getPreferredVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  // Priority: Neural > Natural > Premium > Google > Microsoft > Samantha > Any English
  // Neural and Natural voices sound much more human-like
  const priority = [
    // Neural voices (best quality - available on some systems)
    (v: SpeechSynthesisVoice) =>
      v.lang.startsWith("en") && v.name.toLowerCase().includes("neural"),
    // Natural voices (macOS Monterey+)
    (v: SpeechSynthesisVoice) =>
      v.lang.startsWith("en") && v.name.includes("Natural"),
    // Premium/Enhanced voices
    (v: SpeechSynthesisVoice) =>
      v.lang.startsWith("en") && (v.name.includes("Premium") || v.name.includes("Enhanced")),
    // Specific high-quality voices
    (v: SpeechSynthesisVoice) =>
      v.lang.startsWith("en") && v.name.includes("Samantha"), // macOS default, decent quality
    (v: SpeechSynthesisVoice) =>
      v.lang.startsWith("en") && v.name.includes("Karen"), // Australian, natural sounding
    (v: SpeechSynthesisVoice) =>
      v.lang.startsWith("en") && v.name.includes("Daniel"), // British, clear
    // Google voices (Chrome)
    (v: SpeechSynthesisVoice) =>
      v.lang.startsWith("en") && v.name.includes("Google"),
    // Microsoft voices (Edge/Windows)
    (v: SpeechSynthesisVoice) =>
      v.lang.startsWith("en") && v.name.includes("Microsoft") && v.name.includes("Online"),
    (v: SpeechSynthesisVoice) =>
      v.lang.startsWith("en") && v.name.includes("Microsoft"),
    // Fallbacks
    (v: SpeechSynthesisVoice) => v.lang.startsWith("en-US"),
    (v: SpeechSynthesisVoice) => v.lang.startsWith("en"),
  ];

  for (const filter of priority) {
    const match = voices.find(filter);
    if (match) return match;
  }

  return voices[0] || null;
}
