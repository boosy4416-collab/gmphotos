import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, FolderOpen, CloudUpload, Upload as UploadIcon, X, Plus, Image as ImageIcon, Film } from 'lucide-react'
import styles from './UploadForm.module.css'

const ACCEPTED = '.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.tiff,.mp4,.webm,.mov,.avi,.mkv,.wmv'
const BAD_EXTS = ['exe', 'bat', 'cmd', 'sh', 'ps1', 'msi', 'com', 'scr', 'js', 'jar', 'vbs']

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function makeFileEntry(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (BAD_EXTS.includes(ext)) {
    return { error: `"${file.name}" is not an allowed file type.` }
  }
  const url = URL.createObjectURL(file)
  const type = file.type.startsWith('video') ? 'video' : 'image'
  return {
    id: crypto.randomUUID(),
    file,
    preview: { url, type },
    status: 'pending',
    progress: 0,
    error: null,
    uploadedId: null,
  }
}

async function uploadFileToDrive(file, preview, accessToken, folderId, category, onProgress) {
  const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Type': file.type || 'application/octet-stream',
    },
    body: JSON.stringify({
      name: file.name,
      parents: folderId ? [folderId] : [],
    }),
  })

  if (!initRes.ok) throw new Error('Failed to initialize upload')

  const uploadUrl = initRes.headers.get('Location')
  if (!uploadUrl) throw new Error('No upload URL received')

  const driveFile = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        reject(new Error(`Upload failed (${xhr.status})`))
      }
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(file)
  })

  const metaRes = await fetch('/api/upload/metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originalName: file.name,
      driveFileId: driveFile.id,
      type: preview.type,
      size: file.size,
      category,
    }),
  })

  if (!metaRes.ok) throw new Error('Failed to save file metadata')
  return metaRes.json()
}

export default function UploadForm() {
  const navigate = useNavigate()
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState([])
  const [status, setStatus] = useState('idle') // idle | uploading | success | partial | error
  const [overallProgress, setOverallProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [uploadedIds, setUploadedIds] = useState([])
  const [category, setCategory] = useState('eya')

  function revokeEntry(entry) {
    if (entry?.preview?.url) URL.revokeObjectURL(entry.preview.url)
  }

  function addFiles(fileList) {
    if (!fileList?.length) return

    const errors = []
    const newEntries = []

    for (const f of fileList) {
      const entry = makeFileEntry(f)
      if (entry.error) errors.push(entry.error)
      else newEntries.push(entry)
    }

    if (newEntries.length) {
      setFiles(prev => [...prev, ...newEntries])
      setStatus('idle')
    }
    if (errors.length) {
      setErrorMsg(errors.join(' '))
      if (!newEntries.length) setStatus('error')
    } else {
      setErrorMsg('')
    }
  }

  function removeFile(id) {
    setFiles(prev => {
      const entry = prev.find(f => f.id === id)
      revokeEntry(entry)
      return prev.filter(f => f.id !== id)
    })
    setErrorMsg('')
    setStatus('idle')
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  function updateFile(id, patch) {
    setFiles(prev => prev.map(f => (f.id === id ? { ...f, ...patch } : f)))
  }

  async function handleUpload() {
    if (!files.length || status === 'uploading') return

    setStatus('uploading')
    setOverallProgress(0)
    setErrorMsg('')
    setUploadedIds([])

    const pending = files.filter(f => f.status !== 'done')
    const total = pending.length
    let completed = 0
    const ids = []

    try {
      const tokenRes = await fetch('/api/drive/token')
      if (!tokenRes.ok) throw new Error('Failed to get upload authorization')
      const { accessToken, folderId } = await tokenRes.json()

      for (const entry of pending) {
        updateFile(entry.id, { status: 'uploading', progress: 0, error: null })

        try {
          const result = await uploadFileToDrive(
            entry.file,
            entry.preview,
            accessToken,
            folderId,
            category,
            progress => updateFile(entry.id, { progress })
          )

          completed++
          ids.push(result.id)
          updateFile(entry.id, { status: 'done', progress: 100, uploadedId: result.id })
          setOverallProgress(Math.round((completed / total) * 100))
        } catch (err) {
          updateFile(entry.id, { status: 'error', error: err.message })
          completed++
          setOverallProgress(Math.round((completed / total) * 100))
        }
      }

      setUploadedIds(ids)

      const failed = pending.length - ids.length
      if (failed === 0) {
        setStatus('success')
      } else if (ids.length > 0) {
        setStatus('partial')
        setErrorMsg(`${ids.length} uploaded, ${failed} failed.`)
      } else {
        setStatus('error')
        setErrorMsg('All uploads failed. Please try again.')
      }
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  function reset() {
    files.forEach(revokeEntry)
    setFiles([])
    setStatus('idle')
    setOverallProgress(0)
    setErrorMsg('')
    setUploadedIds([])
    if (inputRef.current) inputRef.current.value = ''
  }

  const doneCount = files.filter(f => f.status === 'done').length || uploadedIds.length
  const isUploading = status === 'uploading'
  const hasFiles = files.length > 0

  return (
    <div className={styles.wrapper}>
      {status === 'success' || status === 'partial' ? (
        <div className={styles.success}>
          <div className={styles.successIcon}><Check size={40} /></div>
          <h3>{status === 'success' ? 'Upload Successful!' : 'Upload Complete'}</h3>
          <p>
            {doneCount === 1
              ? 'Your file has been shared to the gallery.'
              : `${doneCount} files have been shared to the gallery.`}
            {status === 'partial' && errorMsg && ` ${errorMsg}`}
          </p>
          <div className={styles.successActions}>
            <button
              className="btn-primary"
              onClick={() => navigate('/')}
              id="upload-view-btn"
            >
              View Gallery
            </button>
            <button
              className="btn-ghost"
              onClick={reset}
              id="upload-another-btn"
            >
              Upload More
            </button>
          </div>
        </div>
      ) : (
        <>
          {!hasFiles ? (
            <div
              className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload files drop zone"
              id="upload-dropzone"
              onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
            >
              <div className={styles.dropIcon}>
                {dragging ? <FolderOpen size={56} /> : <CloudUpload size={56} />}
              </div>
              <p className={styles.dropText}>
                {dragging ? 'Drop them!' : 'Drag & drop your photos and videos here'}
              </p>
              <p className={styles.dropSub}>or click to browse — select multiple files at once</p>
              <span className={styles.dropTypes}>
                Images & Videos • No size limit
              </span>
            </div>
          ) : (
            <div className={styles.preview}>
              <div className={styles.fileList}>
                {files.map(entry => (
                  <div
                    key={entry.id}
                    className={`${styles.fileItem} ${entry.status === 'uploading' ? styles.fileItemActive : ''} ${entry.status === 'error' ? styles.fileItemError : ''}`}
                  >
                    <div className={styles.fileThumb}>
                      {entry.preview.type === 'image' ? (
                        <img src={entry.preview.url} alt="" />
                      ) : (
                        <video src={entry.preview.url} muted />
                      )}
                      <span className={styles.fileTypeBadge}>
                        {entry.preview.type === 'image' ? <ImageIcon size={12} /> : <Film size={12} />}
                      </span>
                    </div>
                    <div className={styles.fileMeta}>
                      <p className={styles.fileName}>{entry.file.name}</p>
                      <p className={styles.fileSize}>{formatSize(entry.file.size)}</p>
                      {entry.status === 'uploading' && (
                        <div className={styles.fileProgress}>
                          <div className={styles.fileProgressBar} style={{ width: `${entry.progress}%` }} />
                        </div>
                      )}
                      {entry.status === 'error' && (
                        <p className={styles.fileError}>{entry.error}</p>
                      )}
                    </div>
                    {!isUploading && entry.status !== 'done' && (
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeFile(entry.id)}
                        aria-label={`Remove ${entry.file.name}`}
                      >
                        <X size={16} />
                      </button>
                    )}
                    {entry.status === 'done' && (
                      <span className={styles.doneBadge}><Check size={14} /></span>
                    )}
                  </div>
                ))}
              </div>

              {!isUploading && (
                <button
                  type="button"
                  className={styles.addMoreBtn}
                  onClick={() => inputRef.current?.click()}
                >
                  <Plus size={16} /> Add more files
                </button>
              )}

              <div className={styles.categoryRow}>
                <span className={styles.categoryLabel}>Who is this for?</span>
                <div className={styles.categoryBtns}>
                  <button
                    type="button"
                    className={`btn ${category === 'eya' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setCategory('eya')}
                    disabled={isUploading}
                  >
                    Eya
                  </button>
                  <button
                    type="button"
                    className={`btn ${category === 'nada' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setCategory('nada')}
                    disabled={isUploading}
                  >
                    Nada
                  </button>
                </div>
              </div>

              {isUploading && (
                <div className={styles.progressWrap} role="progressbar" aria-valuenow={overallProgress} aria-valuemin={0} aria-valuemax={100}>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressBar} style={{ width: `${overallProgress}%` }} />
                  </div>
                  <span>{overallProgress}%</span>
                </div>
              )}

              {status === 'error' && errorMsg && (
                <p className={styles.error} role="alert">{errorMsg}</p>
              )}

              <div className={styles.actions}>
                {!isUploading && (
                  <>
                    <button
                      className="btn-primary"
                      onClick={handleUpload}
                      id="upload-submit-btn"
                    >
                      <UploadIcon size={18} />
                      Upload {files.length > 1 ? `${files.length} Files` : ''}
                    </button>
                    <button className="btn-ghost" onClick={reset} id="upload-cancel-btn">
                      <X size={18} /> Clear All
                    </button>
                  </>
                )}
                {isUploading && (
                  <p className={styles.uploadingText}>
                    <span className={styles.spinner} /> Uploading…
                  </p>
                )}
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            className={styles.fileInput}
            onChange={e => {
              addFiles(e.target.files)
              e.target.value = ''
            }}
            id="upload-file-input"
            aria-label="Choose files to upload"
          />
        </>
      )}
    </div>
  )
}
