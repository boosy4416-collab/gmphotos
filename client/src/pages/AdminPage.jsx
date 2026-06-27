import AdminPanel from '../components/AdminPanel'
import { TriangleAlert } from 'lucide-react'
import styles from './AdminPage.module.css'

export default function AdminPage() {
  return (
    <main className={`page-wrapper ${styles.page}`}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>
            Admin <span className="gradient-text">Panel</span>
          </h1>
          <p className={styles.subtitle}>
            Manage uploaded media. Only admins can delete files.
          </p>
          <div className={styles.warning} role="note">
            <TriangleAlert size={16} /> Deletions are permanent and cannot be undone.
          </div>
        </div>
        <AdminPanel />
      </div>
    </main>
  )
}
