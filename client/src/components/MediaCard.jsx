import { useNavigate } from 'react-router-dom'
import { Image as ImageIcon, Video } from 'lucide-react'
import styles from './MediaCard.module.css'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaCard({ item, animDelay = 0 }) {
  const navigate = useNavigate()
  const src = `/api/media/stream/${item.driveFileId}`

  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${animDelay}ms` }}
      onClick={() => navigate(`/media/${item.id}`)}
      role="button"
      tabIndex={0}
      aria-label={`View ${item.originalName}`}
      onKeyDown={e => e.key === 'Enter' && navigate(`/media/${item.id}`)}
      id={`media-card-${item.id}`}
    >
      {/* Thumbnail */}
      <div className={styles.thumb}>
        {item.type === 'image' ? (
          <img
            src={src}
            alt={item.originalName}
            loading="lazy"
            draggable={false}
          />
        ) : (
          <video
            src={src}
            muted
            preload="metadata"
            draggable={false}
          />
        )}

        {/* Video play icon */}
        {item.type === 'video' && (
          <div className={styles.playIcon} aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="rgba(0,0,0,0.55)"/>
              <polygon points="16,12 30,20 16,28" fill="white"/>
            </svg>
          </div>
        )}

        {/* Hover overlay */}
        <div className={styles.overlay} aria-hidden="true">
          <p className={styles.name} title={item.originalName}>{item.originalName}</p>
          <div className={styles.meta}>
            <span className={`badge ${item.type === 'image' ? 'badge-image' : 'badge-video'}`}>
              {item.type === 'image' ? <><ImageIcon size={12} /> Image</> : <><Video size={12} /> Video</>}
            </span>
            <span className={styles.date}>{formatDate(item.uploadDate)}</span>
          </div>
          <span className={styles.size}>{formatSize(item.size)}</span>
        </div>
      </div>
    </article>
  )
}
