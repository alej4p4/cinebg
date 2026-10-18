import { useState, useEffect, useRef, useCallback } from 'react'

interface SpeechRecognitionHook {
  isListening: boolean
  transcript: string
  isSupported: boolean
  error: string | null
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

// Interfaces globais do Web Speech API para TypeScript
interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any
  webkitSpeechRecognition?: any
}

export const useSpeechRecognition = (
  onResult?: (transcript: string) => void
): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const win = window as IWindowWithSpeech
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition

    if (SpeechRecognitionClass) {
      setIsSupported(true)
      const recognition = new SpeechRecognitionClass()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'pt-BR'
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
        setError(null)
      }

      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            setTranscript(event.results[i][0].transcript)
          }
        }

        if (finalTranscript) {
          const cleanText = finalTranscript.trim().replace(/\.$/, '')
          setTranscript(cleanText)
          onResult?.(cleanText)
          setIsListening(false)
        }
      }

      recognition.onerror = (event: any) => {
        console.warn('Erro no reconhecimento de voz:', event.error)
        setIsListening(false)
        if (event.error === 'not-allowed') {
          setError('Permissão de microfone negada. Autorize nas configurações.')
        } else if (event.error === 'no-speech') {
          setError('Nenhuma fala detectada. Tente falar mais perto do controle/microfone.')
        } else {
          setError('Não foi possível reconhecer o áudio. Tente novamente.')
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    } else {
      setIsSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {}
      }
    }
  }, [onResult])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Reconhecimento de voz não suportado neste aparelho.')
      return
    }

    try {
      setError(null)
      setTranscript('')
      recognitionRef.current.start()
    } catch (err: any) {
      // Se ja estiver rodando, interrompe e reinicia
      try {
        recognitionRef.current.abort()
        setTimeout(() => recognitionRef.current.start(), 150)
      } catch {
        setError('O microfone já está em uso.')
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }
    setIsListening(false)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  return {
    isListening,
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  }
}

export default useSpeechRecognition
