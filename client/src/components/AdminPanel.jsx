import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, FolderOpen, ExternalLink, Trash2 } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'
import styles from './AdminPanel.module.css'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [shake, setShake] = useState(false)
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(null) // { id, name }
  const [deletingId, setDeletingId] = useState(null)
  const [toast, setToast] = useState(null)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/media')
      if (!res.ok) throw new Error()
      // Test password with a delete request on a fake id
      const testRes = await fetch('/api/admin/media/__test__', {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      })
      // 404 = auth ok (file not found), 401 = wrong password
      if (testRes.status === 401) {
        triggerShake()
        setLoading(false)
        return
      }
      const data = await res.json()
      setMedia(data.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)))
      setAuthed(true)
    } catch {
      triggerShake()
    }
    setLoading(false)
  }

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 600)
  }

  async function handleDelete(id) {
    setConfirm(null)
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/media/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      })
      if (!res.ok) throw new Error('Delete failed')
      setMedia(prev => prev.filter(m => m.id !== id))
      showToast('Deleted successfully')
    } catch {
      showToast('Delete failed. Try again.', true)
    }
    setDeletingId(null)
  }

  function showToast(msg, isError = false) {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 3000)
  }

  if (!authed) {
    return (
      <div className={styles.loginWrap}>
        <div className={`glass-card ${styles.loginCard} ${shake ? styles.shake : ''}`}>
          <div className={styles.lockIcon}><Lock size={48} /></div>
          <h2 className={styles.loginTitle}>Admin Access</h2>
          <p className={styles.loginSub}>Enter the admin password to manage media.</p>
          <form onSubmit={handleLogin} className={styles.loginForm} id="admin-login-form">
            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={styles.passwordInput}
              id="admin-password-input"
              aria-label="Admin password"
              autoFocus
              required
            />
            <button
              type="submit"
              className="btn-primary"
              id="admin-login-btn"
              disabled={loading || !password}
            >
              {loading ? 'Verifying…' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.panelTitle}>Media Management</h2>
          <p className={styles.panelSub}>{media.length} files in gallery</p>
        </div>
        <button className="btn-ghost" onClick={() => setAuthed(false)} id="admin-logout-btn">
          Logout
        </button>
      </div>

      {media.length === 0 ? (
        <div className={styles.empty}>
          <span><FolderOpen size={40} /></span>
          <p>No media uploaded yet.</p>
          <button className="btn-primary" onClick={() => navigate('/upload')} id="admin-upload-cta">
            Upload Media
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {media.map(item => (
            <div
              key={item.id}
              className={`${styles.item} ${deletingId === item.id ? styles.deleting : ''}`}
              id={`admin-item-${item.id}`}
            >
              <div className={styles.thumb}>
                {item.type === 'image' ? (
                  <img src={`/uploads/${item.filename}`} alt={item.originalName} loading="lazy" />
                ) : (
                  <video src={`/uploads/${item.filename}`} muted preload="metadata" />
                )}
                <span className={`badge ${item.type === 'image' ? 'badge-image' : 'badge-video'}`}>
                  {item.type}
                </span>
              </div>
              <div className={styles.info}>
                <p className={styles.itemName} title={item.originalName}>{item.originalName}</p>
                <p className={styles.itemMeta}>{formatSize(item.size)} · {formatDate(item.uploadDate)}</p>
              </div>
              <div className={styles.actions}>
                <button
                  className="btn-ghost"
                  onClick={() => navigate(`/media/${item.id}`)}
                  id={`admin-view-${item.id}`}
                  title="View"
                >
                  <ExternalLink size={16} /> View
                </button>
                <button
                  className="btn-danger"
                  onClick={() => setConfirm({ id: item.id, name: item.originalName })}
                  id={`admin-delete-${item.id}`}
                  disabled={deletingId === item.id}
                  title="Delete"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        message={`Delete "${confirm?.name}"? This cannot be undone.`}
        onConfirm={() => handleDelete(confirm?.id)}
        onCancel={() => setConfirm(null)}
      />

      {toast && (
        <div className={`${styles.toast} ${toast.isError ? styles.toastError : styles.toastSuccess}`} role="status">
          {toast.msg}
        </div>
      )}
    </div>
  )
}
