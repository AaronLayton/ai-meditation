import { Card } from '@/components/ui/card'
import { Volume2 } from 'lucide-react'
import AudioPlayer from 'react-h5-audio-player'

interface MeditationPlayerProps {
  title: string
  audioUrl: string
  onPlay: () => Promise<void>
  onPause: () => void
  onEnded: () => void
}

export function MeditationPlayer({ title, audioUrl, onPlay, onPause, onEnded }: MeditationPlayerProps) {
  const handlePlay = async () => {
    await onPlay()
  }

  const handlePause = async () => {
    onPause()
  }

  return (
    <Card className="p-8 space-y-10 bg-gray-900 border-gray-800">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
          {title}
        </h2>
        <div className="flex items-center justify-center gap-2">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <p className="text-sm font-medium text-gray-400 tracking-wider">RELAXING</p>
        </div>
      </div>

      <AudioPlayer
        src={audioUrl}
        showJumpControls={false}
        layout="stacked"
        className="meditation-player"
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={onEnded}
        autoPlayAfterSrcChange={false}
      />
    </Card>
  )
} 