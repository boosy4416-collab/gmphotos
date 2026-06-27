import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, FolderOpen, CloudUpload, Upload as UploadIcon, X } from 'lucide-react'
import styles from './UploadForm.module.css'

const ACCEPTED = '.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.tiff,.mp4,.webm,.mov,.avi,.mkv,.wmv'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default function UploadForm() {
  const navigate = useNavigate()
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState('idle') // idle | uploading | success | error
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [uploadedId, setUploadedId] = useState(null)

  const [category, setCategory] = useState('eya')

  function selectFile(f) {
    if (!f) return
    // Basic client-side type check
    const ext = f.name.split('.').pop().toLowerCase()
    const badExts = ['exe','bat','cmd','sh','ps1','msi','com','scr','js','jar','vbs']
    if (badExts.includes(ext)) {
      setErrorMsg('That file type is not allowed.')
      setStatus('error')
      return
    }
    setFile(f)
    setStatus('idle')
    setErrorMsg('')
    const url = URL.createObjectURL(f)
    setPreview({ url, type: f.type.startsWith('video') ? 'video' : 'image' })
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    selectFile(e.dataTransfer.files[0])
  }

  async function handleUpload() {
    if (!file) return
    setStatus('uploading')
    setProgress(0)

    try {
      // 1. Get access token from backend
      const tokenRes = await fetch('/api/drive/token')
      if (!tokenRes.ok) throw new Error('Failed to get upload authorization')
      const { accessToken, folderId } = await tokenRes.json()

      // 2. Init resumable upload to Google Drive
      const metadata = {
        name: file.name,
        parents: folderId ? [folderId] : []
      }
      
      const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': file.type || 'application/octet-stream'
        },
        body: JSON.stringify(metadata)
      })
      
      if (!initRes.ok) throw new Error('Failed to initialize upload')
      
      const uploadUrl = initRes.headers.get('Location')
      if (!uploadUrl) throw new Error('No upload URL received')

      // 3. Upload the actual file bytes using XMLHttpRequest to track progress
      const driveFile = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl)
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            console.error('Drive upload failed:', xhr.status, xhr.responseText);
            reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`))
          }
        }
        xhr.onerror = () => reject(new Error('Network error during upload (CORS or dropped connection)'))
        xhr.send(file)
      })

      // 4. Send metadata to backend to save in MongoDB
      const metaRes = await fetch('/api/upload/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalName: file.name,
          driveFileId: driveFile.id,
          type: preview.type, // 'image' or 'video'
          size: file.size,
          category: category
        })
      })
      
      if (!metaRes.ok) throw new Error('Failed to save file metadata')
      
      const result = await metaRes.json()
      
      setProgress(100)
      setUploadedId(result.id)
      setStatus('success')
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  function reset() {
    setFile(null)
    setPreview(null)
    setStatus('idle')
    setProgress(0)
    setErrorMsg('')
    setUploadedId(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={styles.wrapper}>
      {status === 'success' ? (
        <div className={styles.success}>
          <div className={styles.successIcon}><Check size={40} /></div>
          <h3>Upload Successful!</h3>
          <p>Your file has been shared to the gallery.</p>
          <div className={styles.successActions}>
            <button
              className="btn-primary"
              onClick={() => navigate(`/media/${uploadedId}`)}
              id="upload-view-btn"
            >
              View Media
            </button>
            <button
              className="btn-ghost"
              onClick={reset}
              id="upload-another-btn"
            >
              Upload Another
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Drop zone */}
          {!file ? (
            <div
              className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload file drop zone"
              id="upload-dropzone"
              onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
            >
              <div className={styles.dropIcon}>
                {dragging ? <FolderOpen size={56} /> : <CloudUpload size={56} />}
              </div>
              <p className={styles.dropText}>
                {dragging ? 'Drop it!' : 'Drag & drop your file here'}
              </p>
              <p className={styles.dropSub}>or click to browse</p>
              <span className={styles.dropTypes}>
                Images & Videos • No size limit
              </span>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                className={styles.fileInput}
                onChange={e => selectFile(e.target.files[0])}
                id="upload-file-input"
                aria-label="Choose file to upload"
              />
            </div>
          ) : (
            /* Preview + upload */
            <div className={styles.preview}>
              <div className={styles.previewMedia}>
                {preview?.type === 'image' ? (
                  <img src={preview.url} alt="Preview" />
                ) : (
                  <video src={preview.url} controls />
                )}
              </div>
              <div className={styles.fileInfo}>
                <p className={styles.fileName}>{file.name}</p>
                <p className={styles.fileSize}>{formatSize(file.size)}</p>
              </div>

              {status !== 'success' && (
                <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>Who is this for?</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className={`btn ${category === 'eya' ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setCategory('eya')}
                      style={{ minWidth: '80px', padding: '8px 16px' }}
                      disabled={status === 'uploading'}
                    >
                      Eya
                    </button>
                    <button
                      type="button"
                      className={`btn ${category === 'nada' ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setCategory('nada')}
                      style={{ minWidth: '80px', padding: '8px 16px' }}
                      disabled={status === 'uploading'}
                    >
                      Nada
                    </button>
                  </div>
                </div>
              )}

              {status === 'uploading' && (
                <div className={styles.progressWrap} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressBar} style={{ width: `${progress}%` }} />
                  </div>
                  <span>{progress}%</span>
                </div>
              )}

              {status === 'error' && (
                <p className={styles.error} role="alert">{errorMsg}</p>
              )}

              <div className={styles.actions}>
                {status !== 'uploading' && (
                  <>
                    <button
                      className="btn-primary"
                      onClick={handleUpload}
                      id="upload-submit-btn"
                      disabled={status === 'uploading'}
                    >
                      <UploadIcon size={18} /> Upload
                    </button>
                    <button className="btn-ghost" onClick={reset} id="upload-cancel-btn">
                      <X size={18} /> Cancel
                    </button>
                  </>
                )}
                {status === 'uploading' && (
                  <p className={styles.uploadingText}>
                    <span className={styles.spinner} /> Uploading…
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
