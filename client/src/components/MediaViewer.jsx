import { useNavigate } from 'react-router-dom'
import { Image as ImageIcon, Video, ArrowLeft, ArrowRight, Download } from 'lucide-react'
import styles from './MediaViewer.module.css'

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
function formatDate(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function MediaViewer({ item, prevId, nextId }) {
  const navigate = useNavigate()
  const src = `/api/media/stream/${item.driveFileId}`

  function handleDownload() {
    window.open(`https://drive.google.com/uc?export=download&id=${item.driveFileId}`, '_blank')
  }
  
  function handleOpenDrive() {
    window.open(`https://drive.google.com/file/d/${item.driveFileId}/view`, '_blank')
  }

  return (
    <div className={styles.viewer} id="media-viewer">
      {/* Navigation */}
      <div className={styles.topBar}>
        <button className="btn-ghost" onClick={() => navigate('/')} id="viewer-back-btn">
          <ArrowLeft size={16} /> Back to Gallery
        </button>
        <div className={styles.navBtns}>
          <button
            className="btn-ghost"
            onClick={() => navigate(`/media/${prevId}`)}
            disabled={!prevId}
            id="viewer-prev-btn"
            title="Previous"
          >
            <ArrowLeft size={16} /> Prev
          </button>
          <button
            className="btn-ghost"
            onClick={() => navigate(`/media/${nextId}`)}
            disabled={!nextId}
            id="viewer-next-btn"
            title="Next"
          >
            Next <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Media */}
      <div className={styles.mediaWrap}>
        {item.type === 'image' ? (
          <img
            src={src}
            alt={item.originalName}
            className={styles.image}
            draggable={false}
          />
        ) : (
          <video
            src={src}
            controls
            className={styles.video}
            preload="auto"
          />
        )}
      </div>

      {/* Info bar */}
      <div className={`glass-card ${styles.infoBar}`}>
        <div className={styles.infoLeft}>
          <span className={`badge ${item.type === 'image' ? 'badge-image' : 'badge-video'}`}>
            {item.type === 'image' ? <><ImageIcon size={12} /> Image</> : <><Video size={12} /> Video</>}
          </span>
          <div>
            <p className={styles.fileName}>{item.originalName}</p>
            <p className={styles.fileMeta}>
              {formatSize(item.size)} · {formatDate(item.uploadDate)}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-ghost"
            onClick={handleOpenDrive}
            id="viewer-drive-btn"
          >
            Open in Drive
          </button>
          <button
            className="btn-primary"
            onClick={handleDownload}
            id="viewer-download-btn"
          >
            <Download size={16} /> Download
          </button>
        </div>
      </div>
    </div>
  )
}
