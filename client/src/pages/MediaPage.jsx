import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, ArrowLeft } from 'lucide-react'
import MediaViewer from '../components/MediaViewer'
import styles from './MediaPage.module.css'

export default function MediaPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [allMedia, setAllMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    Promise.all([
      fetch(`/api/media/${id}`).then(r => r.ok ? r.json() : null),
      fetch('/api/media').then(r => r.json()),
    ]).then(([media, all]) => {
      if (!media) { setNotFound(true); setLoading(false); return }
      setItem(media)
      setAllMedia(all)
      setLoading(false)
    }).catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  const currentIdx = allMedia.findIndex(m => m.id === id)
  const prevId = currentIdx > 0 ? allMedia[currentIdx - 1]?.id : null
  const nextId = currentIdx < allMedia.length - 1 ? allMedia[currentIdx + 1]?.id : null

  if (loading) {
    return (
      <main className={`page-wrapper ${styles.page}`}>
        <div className="container">
          <div className={styles.loadingWrap}>
            <div className={`${styles.skeletonTop} skeleton`} />
            <div className={`${styles.skeletonMedia} skeleton`} />
            <div className={`${styles.skeletonBar} skeleton`} />
          </div>
        </div>
      </main>
    )
  }

  if (notFound) {
    return (
      <main className={`page-wrapper ${styles.page}`}>
        <div className="container">
          <div className={styles.notFound}>
            <span><Search size={56} /></span>
            <h2>Media not found</h2>
            <p>This file may have been deleted or the link is invalid.</p>
            <button className="btn-primary" onClick={() => navigate('/')} id="not-found-back-btn">
              <ArrowLeft size={16} /> Back to Gallery
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={`page-wrapper ${styles.page}`}>
      <div className="container">
        <MediaViewer item={item} prevId={prevId} nextId={nextId} />
      </div>
    </main>
  )
}
