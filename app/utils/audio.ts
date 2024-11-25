export function fadeAudio(audioElement: HTMLAudioElement, from: number, to: number, duration: number): Promise<void> {
  const steps = 30
  const stepDuration = duration / steps

  return new Promise((resolve) => {
    let currentStep = 0

    const fade = () => {
      currentStep++
      const easedVolume = to > from 
        ? Math.pow(currentStep / steps, 2) * (to - from) + from
        : (1 - Math.pow(1 - currentStep / steps, 2)) * (to - from) + from
      
      audioElement.volume = Math.min(Math.max(easedVolume, 0), 1)

      if (currentStep < steps) {
        setTimeout(fade, stepDuration)
      } else {
        resolve()
      }
    }

    fade()
  })
} 