import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { getMyProfile } from '../lib/profiles'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/ui/Button'
import { formatIndianCurrency } from '../lib/format'

const dashboardStats = [
  { label: 'Outstanding', value: formatIndianCurrency(0), hint: 'No live invoice data yet' },
  { label: 'This month billed', value: formatIndianCurrency(0), hint: 'Will populate from invoices' },
  { label: 'This month received', value: formatIndianCurrency(0), hint: 'Will populate from payments' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profileName, setProfileName] = useState('')

  useEffect(() => {
    let alive = true

    const loadProfile = async () => {
      try {
        const profile = await getMyProfile()
        if (!alive || !profile) return

        setProfileName(
          profile.display_name || profile.business_name || profile.full_name || ''
        )
      } catch {
        if (alive) {
          setProfileName('')
        }
      }
    }

    loadProfile()

    return () => {
      alive = false
    }
  }, [])

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
      navigate('/signin')
    } catch {
      navigate('/signin')
    }
  }

  return (
    <AppLayout
      title={profileName ? `Welcome back, ${profileName}` : 'Dashboard'}
      description="The core billing flows are ready for us to build on this structured shell."
      actions={<Button variant="secondary" onClick={handleSignOut}>Sign out</Button>}
    >
      <section className="dashboard-grid">
        <div className="panel dashboard-summary">
          <p className="eyebrow">Workspace status</p>
          <h2 className="section-title">Your account is connected</h2>
          <p className="section-copy">
            Signed in as <strong>{user?.email}</strong>. Next we can wire in invoice creation,
            client memory, and the share flow on top of this layout.
          </p>
        </div>

        <div className="dashboard-stats">
          {dashboardStats.map((item) => (
            <div className="panel stat-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.hint}</p>
            </div>
          ))}
        </div>

        <div className="panel empty-state">
          <p className="eyebrow">Next build slice</p>
          <h3 className="section-title">Invoice creation flow</h3>
          <p className="section-copy">
            The app shell is now structured. The next meaningful step is building the invoice
            form, line items, GST totals, and preview flow.
          </p>
          <div className="empty-state__actions">
            <Button disabled>Create invoice</Button>
            <Button variant="secondary" disabled>Settings</Button>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
