import { useCallback, useEffect, useRef, useState } from "react";
import { findAnimal, type AnimalId } from "../animals";
import type * as SpeechCommands from "@tensorflow-models/speech-commands";

export type ListeningStatus = "ready" | "loading" | "requesting" | "listening" | "denied" | "error";
type FeedbackTone = "quiet" | "curious" | "found" | "warning";

export interface RecognitionFeedback {
  title: string;
  detail: string;
  label: string;
  confidence: number;
  tone: FeedbackTone;
}

interface Candidate {
  id: AnimalId;
  count: number;
  sum: number;
  at: number;
}

const MODEL_URL = "/model/model.json";
const METADATA_URL = "/model/metadata.json";
const MODEL_START_THRESHOLD = 0.56;
const CONFIRM_THRESHOLD = 0.69;
const INSTANT_THRESHOLD = 0.91;
const MAX_CONFIRM_GAP_MS = 1_600;

function describeError(error: unknown): { status: "denied" | "error"; message: string } {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return {
      status: "denied",
      message: "Microphone access is off. Allow it in your browser's site settings, then try again.",
    };
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return { status: "error", message: "I couldn't find a microphone connected to this device." };
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return { status: "error", message: "The microphone is busy or unavailable. Close other apps using it and try again." };
  }
  if (name === "SecurityError") {
    return { status: "error", message: "Microphone access requires a secure HTTPS connection." };
  }
  return { status: "error", message: "The animal model couldn't start. Check your connection and try again." };
}

export function useAnimalRecognizer() {
  const [status, setStatus] = useState<ListeningStatus>("ready");
  const [statusMessage, setStatusMessage] = useState("Your microphone stays off until you choose to listen.");
  const [feedback, setFeedback] = useState<RecognitionFeedback>({
    title: "The meadow is waiting",
    detail: "Make one clear animal call when you’re ready.",
    label: "Ready",
    confidence: 0,
    tone: "quiet",
  });
  const [visitors, setVisitors] = useState<AnimalId[]>([]);
  const [newestVisitor, setNewestVisitor] = useState<AnimalId | null>(null);
  const [arrivalKey, setArrivalKey] = useState(0);
  const recognizerRef = useRef<SpeechCommands.SpeechCommandRecognizer | null>(null);
  const candidateRef = useRef<Candidate | null>(null);
  const revealedRef = useRef(new Set<AnimalId>());

  const handlePrediction = useCallback((result: SpeechCommands.SpeechCommandRecognizerResult, labels: string[]) => {
    const scoreFrame = Array.isArray(result.scores) ? result.scores[0] : result.scores;
    const scores = Array.from(scoreFrame ?? []);
    const confidence = Math.max(...scores);
    const winningIndex = scores.indexOf(confidence);
    const winningLabel = labels[winningIndex] ?? "Unknown sound";
    const normalizedLabel = winningLabel.trim().toLowerCase();
    const now = Date.now();

    if (normalizedLabel === "background noise" || normalizedLabel === "_background_noise_") {
      candidateRef.current = null;
      setFeedback({
        title: "Just the woodland",
        detail: "Try a little louder animal call; a quiet room is not a visitor.",
        label: "Background noise",
        confidence,
        tone: "quiet",
      });
      return;
    }

    const animal = findAnimal(winningLabel);
    if (!animal) {
      candidateRef.current = null;
      setFeedback({
        title: confidence >= MODEL_START_THRESHOLD ? "Not one of our seven calls" : "Listening for a clear call",
        detail: confidence >= MODEL_START_THRESHOLD ? "Try a cat, cow, dog, duck, sheep, owl, or pig sound." : "Get a little closer to your microphone and call again.",
        label: winningLabel,
        confidence,
        tone: confidence >= MODEL_START_THRESHOLD ? "warning" : "quiet",
      });
      return;
    }

    if (confidence < MODEL_START_THRESHOLD) {
      candidateRef.current = null;
      setFeedback({
        title: "A sound is stirring",
        detail: `I’m not quite sure yet. Try a clearer ${animal.name.toLowerCase()} call.`,
        label: animal.name,
        confidence,
        tone: "curious",
      });
      return;
    }

    const previous = candidateRef.current;
    const current: Candidate = previous?.id === animal.id && now - previous.at <= MAX_CONFIRM_GAP_MS
      ? { id: animal.id, count: previous.count + 1, sum: previous.sum + confidence, at: now }
      : { id: animal.id, count: 1, sum: confidence, at: now };
    candidateRef.current = current;
    const average = current.sum / current.count;
    const isConfirmed = confidence >= INSTANT_THRESHOLD || (current.count >= 2 && average >= CONFIRM_THRESHOLD);

    if (!isConfirmed) {
      setFeedback({
        title: `Something sounds like a ${animal.name.toLowerCase()}…`,
        detail: "Hold that sound for a moment and I’ll bring your visitor into the meadow.",
        label: animal.name,
        confidence,
        tone: "curious",
      });
      return;
    }

    const isFirstVisit = !revealedRef.current.has(animal.id);
    if (isFirstVisit) {
      revealedRef.current.add(animal.id);
      setVisitors((currentVisitors) => currentVisitors.includes(animal.id) ? currentVisitors : [...currentVisitors, animal.id]);
      setNewestVisitor(animal.id);
      setArrivalKey((key) => key + 1);
    }
    candidateRef.current = null;
    setFeedback({
      title: isFirstVisit ? `A ${animal.name.toLowerCase()} is here!` : `${animal.name} heard you!`,
      detail: isFirstVisit ? `${animal.call} — your call brought a new friend into the meadow.` : `${animal.call} — try another animal call to invite someone new.`,
      label: animal.name,
      confidence,
      tone: "found",
    });
  }, []);

  const startListening = useCallback(async () => {
    if (status === "loading" || status === "requesting" || status === "listening") return;
    if (typeof window === "undefined" || !window.isSecureContext) {
      setStatus("error");
      setStatusMessage("This browser needs a secure HTTPS connection before it can use your microphone.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setStatusMessage("This browser can't use the microphone. Try a current version of Chrome, Firefox, or Safari.");
      return;
    }

    setStatus("loading");
    setStatusMessage("Waking the animal model on this device…");
    try {
      const [tf, speechCommands] = await Promise.all([
        import("@tensorflow/tfjs"),
        import("@tensorflow-models/speech-commands"),
      ]);
      if (tf.getBackend() !== "webgl") {
        const webglAvailable = await tf.setBackend("webgl").catch(() => false);
        if (!webglAvailable) await tf.setBackend("cpu");
      }
      await tf.ready();

      let recognizer = recognizerRef.current;
      if (!recognizer) {
        recognizer = speechCommands.create("BROWSER_FFT", undefined, MODEL_URL, METADATA_URL);
        recognizerRef.current = recognizer;
        try {
          await recognizer.ensureModelLoaded();
        } catch (error) {
          recognizerRef.current = null;
          throw error;
        }
      }

      const labels = recognizer.wordLabels();
      setStatus("requesting");
      setStatusMessage("Your browser will ask to use the microphone. Audio is analyzed here and never recorded.");
      candidateRef.current = null;
      await recognizer.listen(
        async (result) => {
          handlePrediction(result, labels);
        },
        {
          includeSpectrogram: false,
          probabilityThreshold: 0,
          invokeCallbackOnNoiseAndUnknown: true,
          overlapFactor: 0.5,
        },
      );
      setStatus("listening");
      setStatusMessage("Listening now. Make one of the animal calls to invite it in.");
      setFeedback((current) => ({
        ...current,
        title: visitors.length ? "Who will visit next?" : "The meadow is listening",
        detail: "Make one clear animal call and watch the clearing.",
        label: "Listening",
        tone: "quiet",
      }));
    } catch (error) {
      const described = describeError(error);
      setStatus(described.status);
      setStatusMessage(described.message);
    }
  }, [handlePrediction, status, visitors.length]);

  const stopListening = useCallback(() => {
    const recognizer = recognizerRef.current;
    if (recognizer?.isListening()) void recognizer.stopListening().catch(() => undefined);
    candidateRef.current = null;
    setStatus("ready");
    setStatusMessage("Listening stopped. Your microphone is off until you start again.");
    setFeedback((current) => ({
      ...current,
      title: visitors.length ? "Your friends are right here" : "The meadow is waiting",
      detail: visitors.length ? "Start listening to call in another visitor." : "Start listening whenever you’re ready to call.",
      label: "Paused",
      tone: "quiet",
    }));
  }, [visitors.length]);

  const resetMeadow = useCallback(() => {
    revealedRef.current.clear();
    candidateRef.current = null;
    setVisitors([]);
    setNewestVisitor(null);
    setFeedback({
      title: status === "listening" ? "The meadow is listening" : "The meadow is waiting",
      detail: "Make a clear animal call to invite your first friend.",
      label: status === "listening" ? "Listening" : "Ready",
      confidence: 0,
      tone: "quiet",
    });
  }, [status]);

  useEffect(() => () => {
    const recognizer = recognizerRef.current;
    if (recognizer?.isListening()) void recognizer.stopListening().catch(() => undefined);
  }, []);

  return {
    status,
    statusMessage,
    feedback,
    visitors,
    newestVisitor,
    arrivalKey,
    startListening,
    stopListening,
    resetMeadow,
  };
}
