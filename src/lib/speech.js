// Browser speech-to-text (Web Speech API) — en-AU, no external service.
const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

export const speechSupported = Boolean(SR)

// Creates a recogniser that calls onText(finalText) for each finished phrase.
export function createRecognizer({ onText, onState }) {
  if (!SR) return null
  const rec = new SR()
  rec.lang = 'en-AU'
  rec.continuous = true
  rec.interimResults = false
  rec.maxAlternatives = 1

  rec.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i]
      if (r.isFinal && r[0]?.transcript) onText(r[0].transcript.trim())
    }
  }
  rec.onstart = () => onState?.(true)
  rec.onend = () => onState?.(false)
  rec.onerror = () => onState?.(false)
  return rec
}
