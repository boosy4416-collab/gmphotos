import UploadForm from '../components/UploadForm'
import { Image as ImageIcon, Video, Infinity } from 'lucide-react'
import styles from './UploadPage.module.css'

export default function UploadPage() {
  return (
    <main className={`page-wrapper ${styles.page}`}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>
            Upload <span className="gradient-text">Media</span>
          </h1>
          <p className={styles.subtitle}>
            Share your photos and videos with the world. No account needed.
          </p>
        </div>

        <div className={styles.formWrap}>
          <UploadForm />
        </div>

        <div className={styles.tips}>
          <div className={styles.tip}>
            <span className={styles.tipIcon}><ImageIcon size={24} /></span>
            <div>
              <strong>Images</strong>
              <p>JPG, PNG, GIF, WebP, BMP, SVG, TIFF</p>
            </div>
          </div>
          <div className={styles.tip}>
            <span className={styles.tipIcon}><Video size={24} /></span>
            <div>
              <strong>Videos</strong>
              <p>MP4, WebM, MOV, AVI, MKV, WMV</p>
            </div>
          </div>
          <div className={styles.tip}>
            <span className={styles.tipIcon}><Infinity size={24} /></span>
            <div>
              <strong>No Size Limit</strong>
              <p>Upload files of any size</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
