"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type RecorderState =
  | "idle"        // No recording yet
  | "requesting"  // Requesting mic permission
  | "recording"   // Actively recording
  | "recorded"    // Has a finished recording
  | "error";      // Error (mic denied, etc.)

export interface UseAudioRecorderOptions {
  timeLimitSeconds?: number;
  onTimeUp?: () => void;
}

export interface UseAudioRecorderReturn {
  state: RecorderState;
  audioUrl: string | null;
  audioBlob: Blob | null;
  elapsedSeconds: number;
  errorMessage: string | null;
  analyserNode: AnalyserNode | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
}

export function useAudioRecorder(
  options: UseAudioRecorderOptions = {}
): UseAudioRecorderReturn {
  const { timeLimitSeconds, onTimeUp } = options;

  const [state, setState] = useState<RecorderState>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-stop when time limit reached
  useEffect(() => {
    if (
      state === "recording" &&
      timeLimitSeconds &&
      elapsedSeconds >= timeLimitSeconds
    ) {
      stopRecording();
      onTimeUpRef.current?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedSeconds, timeLimitSeconds, state]);

  // Handle tab visibility — pause timer display but keep recording
  useEffect(() => {
    if (state !== "recording") return;

    const handleVisibility = () => {
      if (document.hidden) {
        // Tab hidden — keep recording, just note the time
      } else {
        // Tab visible again — resync elapsed from actual start time
        if (startTimeRef.current > 0) {
          setElapsedSeconds(
            Math.floor((Date.now() - startTimeRef.current) / 1000)
          );
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [state]);

  const startRecording = useCallback(async () => {
    // Reset previous
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);
    setElapsedSeconds(0);
    setErrorMessage(null);
    chunksRef.current = [];

    setState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      streamRef.current = stream;

      // Set up Web Audio analyser for waveform
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      setAnalyserNode(analyser);

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setState("recorded");

        // Stop the timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Stop tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        // Close audio context
        audioCtx.close().catch(() => {});
        audioContextRef.current = null;
        setAnalyserNode(null);
      };

      recorder.onerror = () => {
        setState("error");
        setErrorMessage("Recording failed. Please try again.");
        stream.getTracks().forEach((t) => t.stop());
      };

      // Start recording
      recorder.start(250); // Collect data every 250ms
      startTimeRef.current = Date.now();
      setState("recording");

      // Start elapsed timer
      timerRef.current = setInterval(() => {
        setElapsedSeconds(
          Math.floor((Date.now() - startTimeRef.current) / 1000)
        );
      }, 200);
    } catch (err) {
      setState("error");

      if (err instanceof DOMException) {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setErrorMessage(
            "Microphone access denied. Please allow microphone permission in your browser settings and try again."
          );
        } else if (err.name === "NotFoundError") {
          setErrorMessage(
            "No microphone found. Please connect a microphone and try again."
          );
        } else {
          setErrorMessage(`Microphone error: ${err.message}`);
        }
      } else {
        setErrorMessage("Failed to access microphone. Please try again.");
      }
    }
  }, [audioUrl]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
  }, []);

  const resetRecording = useCallback(() => {
    // Stop any active recording
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);

    setAudioUrl(null);
    setAudioBlob(null);
    setElapsedSeconds(0);
    setErrorMessage(null);
    setAnalyserNode(null);
    chunksRef.current = [];
    setState("idle");
  }, [audioUrl]);

  return {
    state,
    audioUrl,
    audioBlob,
    elapsedSeconds,
    errorMessage,
    analyserNode,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
