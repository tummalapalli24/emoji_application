import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

const BASE = import.meta.env.BASE_URL
const WASM_PATH = `${BASE}mediapipe/wasm`
const MODEL_PATH = `${BASE}mediapipe/models/face_landmarker.task`

let landmarkerPromise: Promise<FaceLandmarker> | null = null

async function create(): Promise<FaceLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks(WASM_PATH)
  const options = (delegate: 'GPU' | 'CPU') => ({
    baseOptions: { modelAssetPath: MODEL_PATH, delegate },
    runningMode: 'VIDEO' as const,
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: false,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })
  try {
    return await FaceLandmarker.createFromOptions(fileset, options('GPU'))
  } catch (gpuError) {
    console.warn('GPU delegate unavailable, falling back to CPU.', gpuError)
    return await FaceLandmarker.createFromOptions(fileset, options('CPU'))
  }
}

/** Loads the face model once and reuses it across games. Failed loads can be retried. */
export function loadFaceLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = create().catch((err) => {
      landmarkerPromise = null
      throw err
    })
  }
  return landmarkerPromise
}
