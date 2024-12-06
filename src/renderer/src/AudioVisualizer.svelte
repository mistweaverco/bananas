<script lang="ts">
  import { onMount, onDestroy } from 'svelte'

  export let stream: MediaStream | null = null
  export let className: string = ''
  export let visualizerIsActive: boolean = false

  let canvas: HTMLCanvasElement
  let audioCtx: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let animationFrameId: number

  const ACTIVE_THRESHOLD = 0.006 // Threshold for activation, using normalized RMS
  const ACTIVATION_PERCENTAGE = 0.1
  const HEIGHT_SCALE = 4
  const BUFFER_SIZE = 256 // Size of the circular buffer for signal data
  const DELAY_FRAMES = 50 // Number of frames delay
  const EASING_FACTOR = 0.1 // Smoothing factor for displayed values
  const DECAY_RATE = 0.05 // Rate at which bars decay when signal weakens

  let smoothedRMS = 0
  let buffer: number[] = [] // Rolling buffer for RMS activation
  let signalBuffer: number[][] = [] // Circular buffer for signal data
  let displayedValues: number[] = [] // Smoothed displayed values
  let signalBufferIndex = 0 // Current write position in signal buffer

  function visualize(s: MediaStream): void {
    if (!canvas) return

    if (!audioCtx) {
      audioCtx = new AudioContext()
    }

    const canvasCtx = canvas.getContext('2d')
    const source = audioCtx.createMediaStreamSource(s)

    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    // Initialize the signal buffer
    signalBuffer = Array.from({ length: DELAY_FRAMES }, () => new Array(bufferLength).fill(0))
    displayedValues = new Array(bufferLength).fill(0) // Initialize displayed values

    source.connect(analyser)

    function calculateRMS(data: Uint8Array): number {
      const squaredSum = data.reduce((sum, value) => sum + Math.pow(value / 128.0 - 1.0, 2), 0)
      return Math.sqrt(squaredSum / data.length)
    }

    function draw(): void {
      animationFrameId = requestAnimationFrame(draw)

      if (!canvas || !canvasCtx || !analyser) return

      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      const centerY = canvasHeight / 2

      analyser.getByteTimeDomainData(dataArray)

      // Store the current signal in the circular buffer
      signalBuffer[signalBufferIndex] = [...dataArray]
      signalBufferIndex = (signalBufferIndex + 1) % DELAY_FRAMES

      // Retrieve the delayed signal
      const delayedSignal = signalBuffer[(signalBufferIndex + 1) % DELAY_FRAMES]

      // Smoothly update displayed values
      for (let i = 0; i < delayedSignal.length; i++) {
        const targetValue = (delayedSignal[i] / 128.0 - 1.0) * 3 // Amplify signal, for better visualization
        if (Math.abs(targetValue) > Math.abs(displayedValues[i])) {
          // Easing up to the target value
          displayedValues[i] += (targetValue - displayedValues[i]) * EASING_FACTOR
        } else {
          // Decay toward zero when the signal weakens
          displayedValues[i] *= 1 - DECAY_RATE
        }
        displayedValues[i] = Math.min(Math.max(displayedValues[i], -1), 1) // Clamp to visible range
      }

      canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight)
      canvasCtx.fillStyle = 'transparent'
      canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight)

      canvasCtx.lineWidth = 2
      canvasCtx.strokeStyle = 'rgb(0, 0, 0)'
      canvasCtx.beginPath()

      const sliceWidth = canvasWidth / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const y = centerY + displayedValues[i] * (centerY * HEIGHT_SCALE * 1.5) // Additional scaling

        if (i === 0) {
          canvasCtx.moveTo(x, y)
        } else {
          canvasCtx.lineTo(x, y)
        }
        x += sliceWidth
      }

      canvasCtx.lineTo(canvasWidth, centerY)
      canvasCtx.stroke()

      // Calculate RMS
      const rms = calculateRMS(dataArray)

      // Smooth RMS
      smoothedRMS = 0.8 * smoothedRMS + 0.2 * rms

      // Update rolling buffer for activation
      buffer.push(smoothedRMS)
      if (buffer.length > BUFFER_SIZE) {
        buffer.shift()
      }

      // Analyze buffer to determine activation
      const activeCount = buffer.filter((value) => value > ACTIVE_THRESHOLD).length
      const activePercentage = activeCount / buffer.length

      visualizerIsActive = activePercentage >= ACTIVATION_PERCENTAGE
    }

    draw()
  }

  onMount(() => {
    if (stream) {
      visualize(stream)
    }
  })

  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    if (audioCtx) {
      audioCtx.close()
    }
    audioCtx = null
    analyser = null
  })
</script>

<canvas class={className} bind:this={canvas}></canvas>

<style>
  canvas {
    margin-inline-end: initial important;
    margin-inline-start: initial !important;
  }
</style>
