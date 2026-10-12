import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { FaceLandmarker } from '@mediapipe/tasks-vision'
import { createGameRounds, type ExpressionDefinition } from './lib/expressions'
import { CameraError, startCamera, stopCamera } from './lib/camera'
import { loadFaceLandmarker } from './lib/faceModel'
import { setMuted as setSoundMuted, sounds } from './lib/sound'
import { WelcomeScreen } from './components/WelcomeScreen'
import { GameScreen } from './components/GameScreen'
import { ResultsScreen } from './components/ResultsScreen'
import { AppControls } from './components/AppControls'
import { StartOverlay, type StartupError, type StepStatus } from './components/StartOverlay'

type Screen = 'welcome' | 'game' | 'results'

interface Startup {
  camera: StepStatus
  model: StepStatus
  error: StartupError | null
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [startup, setStartup] = useState<Startup | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null)
  const [rounds, setRounds] = useState<ExpressionDefinition[]>(() => createGameRounds())
  const [scores, setScores] = useState<number[]>([])
  const [gameId, setGameId] = useState(0)
  const [muted, setMuted] = useState(true)
  const attempt = useRef(0)

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    setSoundMuted(next)
    if (!next) sounds.click()
  }

  const startGame = useCallback(async () => {
    const id = ++attempt.current
    sounds.click()
    setStartup({ camera: 'pending', model: 'pending', error: null })

    const cameraTask = startCamera().then((s) => {
      if (id === attempt.current) setStartup((st) => st && { ...st, camera: 'done' })
      return s
    })
    const modelTask = loadFaceLandmarker().then((m) => {
      if (id === attempt.current) setStartup((st) => st && { ...st, model: 'done' })
      return m
    })
    const [cam, model] = await Promise.allSettled([cameraTask, modelTask])

    if (id !== attempt.current) {
      if (cam.status === 'fulfilled') stopCamera(cam.value)
      return
    }

    if (cam.status === 'rejected' || model.status === 'rejected') {
      if (cam.status === 'fulfilled') stopCamera(cam.value)
      let error: StartupError
      if (cam.status === 'rejected') {
        const reason = cam.reason
        error = {
          title: reason instanceof CameraError && reason.kind === 'denied' ? 'CAMERA BLOCKED' : 'CAMERA PROBLEM',
          message: reason instanceof CameraError ? reason.message : 'We couldn’t start the camera. Please try again.',
        }
      } else {
        console.error(model.status === 'rejected' ? model.reason : '')
        error = {
          title: 'AI MODEL DIDN’T LOAD',
          message: 'The face-tracking model couldn’t start. Make sure you’re using an up-to-date Chrome, Edge, or Safari, then try again.',
        }
      }
      setStartup({
        camera: cam.status === 'fulfilled' ? 'done' : 'failed',
        model: model.status === 'fulfilled' ? 'done' : 'failed',
        error,
      })
      return
    }

    setStream(cam.value)
    setLandmarker(model.value)
    setRounds(createGameRounds())
    setScores([])
    setGameId((g) => g + 1)
    setStartup(null)
    setScreen('game')
  }, [])

  const cancelStartup = () => {
    attempt.current++
    setStartup(null)
    setScreen('welcome')
  }

  const handleComplete = useCallback((finalScores: number[]) => {
    setScores(finalScores)
    setStream(null)
    setScreen('results')
    sounds.fanfare()
  }, [])

  // Release the camera whenever the stream is replaced, cleared, or the page closes.
  useEffect(() => {
    if (!stream) return
    const release = () => stopCamera(stream)
    window.addEventListener('pagehide', release)
    return () => {
      window.removeEventListener('pagehide', release)
      release()
    }
  }, [stream])

  const page = (key: string, content: ReactNode) => (
    <motion.div
      key={key}
      className="h-full"
      initial={{ opacity: 0, scale: 1.03 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {content}
    </motion.div>
  )

  return (
    <div className="h-full bg-az-night">
      <AnimatePresence mode="wait">
        {screen === 'welcome' && page('welcome', <WelcomeScreen onStart={startGame} starting={startup !== null} />)}
        {screen === 'game' &&
          stream &&
          landmarker &&
          page(`game-${gameId}`, <GameScreen stream={stream} landmarker={landmarker} rounds={rounds} onComplete={handleComplete} />)}
        {screen === 'results' &&
          page('results', <ResultsScreen rounds={rounds} scores={scores} onPlayAgain={startGame} starting={startup !== null} />)}
      </AnimatePresence>

      <AnimatePresence>
        {startup && (
          <StartOverlay
            key="startup"
            camera={startup.camera}
            model={startup.model}
            error={startup.error}
            onRetry={startGame}
            onCancel={cancelStartup}
          />
        )}
      </AnimatePresence>
      <AppControls muted={muted} onToggleMute={toggleMute} />
    </div>
  )
}
