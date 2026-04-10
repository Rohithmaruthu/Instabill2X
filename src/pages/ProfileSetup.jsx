import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getMyProfile } from '../lib/profiles'
import AuthLayout from '../components/layout/AuthLayout'
import Button from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import LoadingScreen from '../components/LoadingScreen'

export default function ProfileSetup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [upiId, setUpiId] = useState('')
  const [gstin, setGstin] = useState('')
  const [footerText, setFooterText] = useState('')
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    const loadProfile = async () => {
      try {
        const profile = await getMyProfile()

        if (!alive || !profile) {
          return
        }

        setFullName(profile.full_name ?? '')
        setBusinessName(profile.business_name ?? '')
        setUpiId(profile.upi_id ?? '')
        setGstin(profile.gstin ?? '')
        setFooterText(profile.footer_text ?? '')
      } catch {
        if (alive) {
          setError('We could not load your profile details.')
        }
      } finally {
        if (alive) {
          setBootstrapping(false)
        }
      }
    }

    loadProfile()

    return () => {
      alive = false
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()

    const trimmedFullName = fullName.trim()
    const trimmedBusinessName = businessName.trim()
    const trimmedUpiId = upiId.trim()

    if (!trimmedFullName && !trimmedBusinessName) {
      setError('Enter your name or business name.')
      return
    }

    if (!trimmedUpiId) {
      setError('Enter your UPI ID.')
      return
    }

    try {
      setLoading(true)
      setError('')

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error('auth')
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedFullName || null,
          business_name: trimmedBusinessName || null,
          upi_id: trimmedUpiId,
          gstin: gstin.trim() || null,
          footer_text: footerText.trim() || null,
        })
        .eq('id', user.id)

      if (updateError) {
        throw new Error('update')
      }

      navigate('/app')
    } catch {
      setError('We could not save your profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (bootstrapping) {
    return <LoadingScreen message="Loading your profile..." />
  }

  return (
    <AuthLayout
      eyebrow="Profile setup"
      title="Set up your profile"
      description="These details will prefill every invoice you create."
      asideTitle="One solid profile saves repetition on every future invoice."
      asideCopy="You can refine the business details later, but your name and UPI ID are enough to unlock the first working flow."
    >
      <form onSubmit={handleSubmit} className="stack">
        <div className="grid grid--two">
          <Field
            label="Your name"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
          <Field
            label="Business name"
            type="text"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
          />
        </div>

        <Field
          label="UPI ID"
          type="text"
          value={upiId}
          onChange={(event) => setUpiId(event.target.value)}
          hint="Required for the invoice payment flow."
        />
        <Field
          label="GSTIN"
          type="text"
          value={gstin}
          onChange={(event) => setGstin(event.target.value)}
        />
        <Field
          label="Footer text"
          multiline
          rows="4"
          value={footerText}
          onChange={(event) => setFooterText(event.target.value)}
          hint="Optional note shown at the bottom of your invoice."
        />

        {error ? <p className="alert alert--error">{error}</p> : null}

        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save and continue'}
        </Button>
      </form>
    </AuthLayout>
  )
}
