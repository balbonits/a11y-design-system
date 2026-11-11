// R-4: audio description cues as text (always) and optional voicing through speechSynthesis.
// The UI owns the polite live region and the toggles; this decides what to say and when.
// Pause-while-speaking is a handoff decision, so it's an option (default off) rather than built-in behaviour.
import type { Cue } from './vtt';
import { createCueFollower } from './tracks';
import type { Player } from './player';

export type DescriptionsMode = 'off' | 'text' | 'voice';

export interface SpeechLike {
  speak(u: { text: string; lang?: string; onend?: () => void }): void;
  cancel(): void;
}

/** Wraps window.speechSynthesis; returns null where voicing isn't supported, so the UI can hide "Voice descriptions". */
export function browserSpeech(win: (Window & typeof globalThis) | undefined = typeof window === 'undefined' ? undefined : window): SpeechLike | null {
  const synth = win?.speechSynthesis;
  const Utter = win?.SpeechSynthesisUtterance;
  if (!synth || !Utter) return null;
  return {
    speak({ text, lang, onend }) {
      const u = new Utter(text);
      if (lang) u.lang = lang;
      if (onend) u.onend = onend;
      synth.speak(u);
    },
    cancel: () => synth.cancel(),
  };
}

export interface DescriptionsOptions {
  player: Pick<Player, 'on' | 'getTime' | 'pause' | 'play'>;
  cues: readonly Cue[];
  lang?: string;
  /** Called with the text the live region should show ('' clears it). */
  onText: (text: string) => void;
  speech?: SpeechLike | null;
  /** Pause playback while a voiced description is speaking, then resume. Default false. */
  pauseWhileSpeaking?: boolean;
}

export function createDescriptions({ player, cues, lang, onText, speech = null, pauseWhileSpeaking = false }: DescriptionsOptions) {
  let mode: DescriptionsMode = 'off';
  let pausedBySpeech = false;
  const onChange = ({ active, entered }: { active: readonly Cue[]; entered: readonly Cue[] }) => {
    if (mode === 'off') return;
    onText(active.map((c) => c.text).join('\n'));
    if (mode !== 'voice' || !speech || entered.length === 0) return;
    speech.cancel();
    const text = entered.map((c) => c.text).join(' ');
    if (pauseWhileSpeaking) {
      pausedBySpeech = true;
      void player.pause();
    }
    speech.speak({
      text,
      lang,
      onend: () => {
        if (pausedBySpeech) {
          pausedBySpeech = false;
          void player.play();
        }
      },
    });
  };
  let follower = createCueFollower(cues, onChange);
  const offs = [
    player.on('timeupdate', () => follower.update(player.getTime())),
    player.on('pause', () => {
      if (!pausedBySpeech) speech?.cancel();
    }),
  ];
  return {
    get mode() {
      return mode;
    },
    /** 'voice' falls back to 'text' when speech isn't available. Returns the mode actually set. */
    setMode(next: DescriptionsMode): DescriptionsMode {
      mode = next === 'voice' && !speech ? 'text' : next;
      speech?.cancel();
      pausedBySpeech = false;
      follower.reset();
      if (mode === 'off') onText('');
      else follower.update(player.getTime());
      return mode;
    },
    /** Switch the AD track (another language or variant) without changing the mode; speech in flight is cancelled. */
    setTrack(nextCues: readonly Cue[], nextLang?: string): void {
      speech?.cancel();
      if (pausedBySpeech) {
        pausedBySpeech = false;
        void player.play();
      }
      lang = nextLang;
      follower = createCueFollower(nextCues, onChange);
      if (mode === 'off') return;
      onText('');
      follower.update(player.getTime());
    },
    canVoice: speech !== null,
    destroy(): void {
      offs.forEach((off) => off());
      speech?.cancel();
    },
  };
}
