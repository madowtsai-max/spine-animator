import { useRef, useState } from 'react'
import { useStore } from '../../store/useStore'
import { parseAtlas } from '../../parsers/atlasParser'
import { parseSpineJson } from '../../parsers/spineParser'
import { extractAllSlotImages } from '../../parsers/atlasExtractor'

interface UploadedFiles {
  json: File | null
  atlas: File | null
  texture: File | null
}

export function SpineUploader() {
  const setSpineData = useStore((s) => s.setSpineData)
  const clearSpineData = useStore((s) => s.clearSpineData)

  const [files, setFiles] = useState<UploadedFiles>({ json: null, atlas: null, texture: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const jsonRef = useRef<HTMLInputElement>(null)
  const atlasRef = useRef<HTMLInputElement>(null)
  const textureRef = useRef<HTMLInputElement>(null)

  function setFile(key: keyof UploadedFiles, file: File) {
    setFiles((prev) => ({ ...prev, [key]: file }))
    setError(null)
  }

  async function handleLoad() {
    if (!files.json || !files.atlas || !files.texture) {
      setError('Please upload all three files: .json, .atlas, and the texture image')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const [jsonText, atlasText, textureDataUrl] = await Promise.all([
        readAsText(files.json),
        readAsText(files.atlas),
        readAsDataUrl(files.texture),
      ])

      const spineData = parseSpineJson(jsonText)
      const atlasData = parseAtlas(atlasText)
      const slotImages = await extractAllSlotImages(textureDataUrl, atlasData.regions)

      setSpineData(spineData, atlasData, textureDataUrl, slotImages)
    } catch (e) {
      setError(`Failed to parse files: ${(e as Error).message}`)
      clearSpineData()
    } finally {
      setLoading(false)
    }
  }

  const allUploaded = files.json && files.atlas && files.texture

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 uppercase tracking-widest">Step 1 — Upload Spine Bundle</p>

      <div className="space-y-2">
        <FileRow label=".json" file={files.json} accept=".json" inputRef={jsonRef} onFile={(f) => setFile('json', f)} />
        <FileRow label=".atlas" file={files.atlas} accept=".atlas,.txt" inputRef={atlasRef} onFile={(f) => setFile('atlas', f)} />
        <FileRow label="Texture (.webp / .png)" file={files.texture} accept="image/*" inputRef={textureRef} onFile={(f) => setFile('texture', f)} />
      </div>

      {error && <p className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}

      <button
        onClick={handleLoad}
        disabled={!allUploaded || loading}
        className="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-30 hover:bg-accent-hover transition-colors"
      >
        {loading ? 'Reading files...' : 'Load & Extract Images'}
      </button>
    </div>
  )
}

function FileRow({
  label,
  file,
  accept,
  inputRef,
  onFile,
}: {
  label: string
  file: File | null
  accept: string
  inputRef: React.RefObject<HTMLInputElement>
  onFile: (f: File) => void
}) {
  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
        file
          ? 'border-accent/40 bg-accent/5 text-white'
          : 'border-dashed border-border bg-surface-2 text-gray-500 hover:border-gray-500'
      }`}
    >
      <span className={`text-lg ${file ? 'text-accent' : ''}`}>{file ? '✓' : '+'}</span>
      <div className="flex-1">
        <div className="text-xs text-gray-500">{label}</div>
        {file && <div className="text-sm">{file.name}</div>}
        {!file && <div className="text-sm">Click to upload</div>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />
    </div>
  )
}

function readAsText(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = (e) => res(e.target?.result as string)
    r.onerror = rej
    r.readAsText(file)
  })
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = (e) => res(e.target?.result as string)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}
