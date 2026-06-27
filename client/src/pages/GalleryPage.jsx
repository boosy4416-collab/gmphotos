import { useState, useEffect } from 'react'
import MediaGrid from '../components/MediaGrid'
import styles from './GalleryPage.module.css'

export default function GalleryPage() {
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState(null)

  useEffect(() => {
    fetch('/api/media')
      .then(r => r.json())
      .then(data => { setMedia(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filteredMedia = media.filter(item => item.category === categoryFilter)

  if (!categoryFilter) {
    return (
      <main className={`page-wrapper ${styles.page}`}>
        <div className="container">
          <div className={styles.selectionScreen}>
            <h1 className={styles.selectionTitle} style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', margin: '0 0 16px' }}>
              Welcome to <span className="gradient-text">GMPhotos</span>
            </h1>
            <p className={styles.selectionSub} style={{ fontSize: '1.2rem', marginBottom: '48px' }}>
              Please select a gallery to view photos & videos:
            </p>
            <div className={styles.selectionCards}>
              <div className={styles.selectionCard} onClick={() => setCategoryFilter('eya')}>
                <h3>Eya</h3>
                <span>View Eya's Collection</span>
              </div>
              <div className={styles.selectionCard} onClick={() => setCategoryFilter('nada')}>
                <h3>Nada</h3>
                <span>View Nada's Collection</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={`page-wrapper ${styles.page}`}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true" />
        <div className="container">
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              <span className="gradient-text">GMPhotos</span>
            </h1>
            <p className={styles.heroSub}>
              Currently viewing <strong>{categoryFilter === 'eya' ? "Eya's" : "Nada's"}</strong> gallery.
            </p>
            <div className={styles.heroStats}>
              <span className={styles.stat}>
                <strong>{filteredMedia.filter(m => m.type === 'image').length}</strong> Photos
              </span>
              <span className={styles.statDivider} />
              <span className={styles.stat}>
                <strong>{filteredMedia.filter(m => m.type === 'video').length}</strong> Videos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs & Back Control */}
      <div className="container" style={{ margin: '24px auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <button
          className="btn-ghost"
          onClick={() => setCategoryFilter(null)}
          style={{ padding: '8px 16px', fontWeight: '500', borderRadius: '8px' }}
        >
          ← Choose Gallery
        </button>
        <div style={{ display: 'flex', gap: '8px', padding: '6px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.08)' }}>
          <button
            className={`btn ${categoryFilter === 'eya' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setCategoryFilter('eya')}
            style={{ borderRadius: '8px', padding: '8px 24px', fontWeight: '600' }}
          >
            Eya's Gallery
          </button>
          <button
            className={`btn ${categoryFilter === 'nada' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setCategoryFilter('nada')}
            style={{ borderRadius: '8px', padding: '8px 24px', fontWeight: '600' }}
          >
            Nada's Gallery
          </button>
        </div>
      </div>

      {/* Gallery */}
      <div className="container">
        <MediaGrid
          media={filteredMedia}
          loading={loading}
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>
    </main>
  )
}
