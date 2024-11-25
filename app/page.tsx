'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SendHorizontal, Loader2 } from 'lucide-react'
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { generateMeditation } from './actions'
import { fadeAudio } from './utils/audio';
import { MeditationPlayer } from './components/MeditationPlayer';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function MeditationApp() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(true)
  const backgroundAudioRef = useRef<HTMLAudioElement>(null)
  const [meditationTitle, setMeditationTitle] = useState('')

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(darkModeMediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
    darkModeMediaQuery.addEventListener('change', handleChange)

    return () => darkModeMediaQuery.removeEventListener('change', handleChange)
  }, [])

  const handleGenerate = async () => {
    try {
      console.log('Button clicked, prompt:', prompt)
      setIsGenerating(true)
      const result = await generateMeditation(prompt)
      
      console.log('Generation result:', result)
      
      if (result.success) {
        console.log('Creating audio blob from base64 string')
        const audioBlob = Buffer.from(result.audioContent, 'base64')
        const audioUrl = URL.createObjectURL(new Blob([audioBlob], { type: 'audio/mpeg' }))
        console.log('Audio URL created:', audioUrl)
        setMeditationTitle(result.title)
        setAudioUrl(audioUrl)
      } else {
        console.error('Generation failed:', result.error)
      }
    } catch (error) {
      console.error('Error in handleGenerate:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Clean up audio URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  // Fix the key prop warning by using a stable identifier
  const examplePrompts = [
    { id: 1, text: "Five-minute meditation on self-compassion" },
    { id: 2, text: "Ten-minute meditation on simple mindfulness" },
    { id: 3, text: "Seven-minute meditation on facing difficult emotions" },
    { id: 4, text: "Three-minute breathing exercise for relaxation" },
  ]

  const handlePlay = async () => {
    if (backgroundAudioRef.current) {
      // Start with volume at 0
      backgroundAudioRef.current.volume = 0
      backgroundAudioRef.current.play()
      // Fade in background music first
      await fadeAudio(backgroundAudioRef.current, 0, 0.35, 1000) // Increased max volume to 0.35
      // Wait for 1 second before starting meditation
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  const handlePause = async () => {
    if (backgroundAudioRef.current) {
      // Fade out background music
      await fadeAudio(backgroundAudioRef.current, backgroundAudioRef.current.volume, 0, 1000)
      backgroundAudioRef.current.pause()
    }
  }

  const handleEnded = async () => {
    if (backgroundAudioRef.current) {
      // Keep playing for a moment after meditation ends
      await new Promise(resolve => setTimeout(resolve, 500))
      // Then fade out
      await fadeAudio(backgroundAudioRef.current, backgroundAudioRef.current.volume, 0, 1500)
      backgroundAudioRef.current.pause()
    }
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-background text-foreground dark:bg-gray-900 dark:text-gray-100">
        <div className="container max-w-md mx-auto p-4 flex flex-col h-screen">
          <header className="py-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
              {getGreeting()}
            </h1>
          </header>

          <ScrollArea className="w-full mb-6">
            <div className="flex w-full space-x-3 pb-4">
              {examplePrompts.map((prompt) => (
                <Card 
                  key={prompt.id}
                  className="p-4 flex-shrink-0 w-[160px] h-[100px] dark:bg-gray-800 bg-gray-100/40 overflow-hidden cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    setPrompt(prompt.text)
                    const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement
                    if (inputElement) {
                      inputElement.focus()
                    }
                  }}
                >
                  <p className="text-sm text-muted-foreground dark:text-gray-400 line-clamp-3 break-words">
                    {prompt.text}
                  </p>
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {audioUrl && (
            <div className="mb-6">
              <MeditationPlayer
                title={meditationTitle}
                audioUrl={audioUrl}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
              />
              <audio 
                ref={backgroundAudioRef} 
                src="/tracks/meditation-background.mp3" 
                loop 
                crossOrigin="anonymous"
              >
                <track kind="captions" />
              </audio>
            </div>
          )}

          <div className="mt-auto">
            <div className="relative flex items-center mb-4">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your meditation prompt..."
                className="w-full p-4 rounded-full bg-muted/50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
                aria-label="Meditation prompt input"
              />
              <div className="absolute right-2">
                <Button
                  size="icon"
                  className="rounded-full"
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  aria-label="Generate meditation"
                >
                  {isGenerating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <SendHorizontal className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

