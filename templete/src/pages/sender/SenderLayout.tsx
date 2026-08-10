import { Outlet } from 'react-router-dom'
import { BottomNav } from '../../components/BottomNav'

export default function SenderLayout() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 72 }}>
      <Outlet />
      <BottomNav />
    </div>
  )
}
