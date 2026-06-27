import { useRef, useEffect } from 'react'
import { TriangleAlert } from 'lucide-react'
import styles from './ConfirmDialog.module.css'

export default function ConfirmDialog({ open, message, onConfirm, onCancel }) {
  const dialogRef = useRef()

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open) el.showModal()
    else el.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onCancel={onCancel}
      aria-labelledby="confirm-title"
      id="confirm-dialog"
    >
      <div className={styles.inner}>
        <div className={styles.icon} aria-hidden="true"><TriangleAlert size={40} /></div>
        <h3 id="confirm-title" className={styles.title}>Are you sure?</h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button
            className="btn-danger"
            onClick={onConfirm}
            id="confirm-ok-btn"
          >
            Delete
          </button>
          <button
            className="btn-ghost"
            onClick={onCancel}
            id="confirm-cancel-btn"
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  )
}
