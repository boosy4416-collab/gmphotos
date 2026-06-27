import MediaCard from './MediaCard'
import styles from './MediaGrid.module.css'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, Image as ImageIcon, Video, FolderOpen, Upload as UploadIcon } from 'lucide-react'

function SkeletonCard() {
  return <div className={`${styles.skeletonCard} skeleton`} />
}

export default function MediaGrid({ media, loading, filter, onFilterChange }) {
  const navigate = useNavigate()

  const filtered = filter === 'all' ? media : media.filter(m => m.type === filter)

  return (
    <div className={styles.wrapper}>
      {/* Filter bar */}
      <div className={styles.filterBar} role="group" aria-label="Filter media by type">
        {['all', 'image', 'video'].map(f => (
          <button
            key={f}
            id={`filter-${f}`}
            className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
            onClick={() => onFilterChange(f)}
          >
            {f === 'all' ? <><LayoutGrid size={16} style={{marginRight: 4}}/> All</> : f === 'image' ? <><ImageIcon size={16} style={{marginRight: 4}}/> Images</> : <><Video size={16} style={{marginRight: 4}}/> Videos</>}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon} aria-hidden="true">
            {filter === 'video' ? <Video size={64} /> : filter === 'image' ? <ImageIcon size={64} /> : <FolderOpen size={64} />}
          </div>
          <h3>No {filter === 'all' ? '' : filter + 's '}uploaded yet</h3>
          <p>Be the first to share something!</p>
          <button
            className="btn-primary"
            onClick={() => navigate('/upload')}
            id="gallery-upload-cta"
          >
            <UploadIcon size={18} /> Upload Media
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((item, i) => (
            <MediaCard
              key={item.id}
              item={item}
              animDelay={Math.min(i * 60, 600)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
