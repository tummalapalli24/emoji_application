export type CameraErrorKind = 'denied' | 'not-found' | 'in-use' | 'insecure' | 'unknown'

export class CameraError extends Error {
  readonly kind: CameraErrorKind
  constructor(kind: CameraErrorKind, message: string) {
    super(message)
    this.kind = kind
  }
}

export async function startCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new CameraError(
      'insecure',
      'This browser can’t access the camera here. Open the game on localhost or an https:// address in Chrome, Edge, or Safari.',
    )
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
    })
  } catch (err) {
    const name = err instanceof DOMException ? err.name : ''
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      throw new CameraError(
        'denied',
        'Camera access was blocked. Click the camera icon in your browser’s address bar, choose “Allow”, then try again.',
      )
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      throw new CameraError('not-found', 'No camera was found. Plug in a webcam and try again.')
    }
    if (name === 'NotReadableError' || name === 'AbortError') {
      throw new CameraError(
        'in-use',
        'The camera is busy. Close other apps or tabs that might be using it (Zoom, FaceTime, etc.) and try again.',
      )
    }
    throw new CameraError('unknown', 'Something went wrong starting the camera. Please try again.')
  }
}

export function stopCamera(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop())
}
