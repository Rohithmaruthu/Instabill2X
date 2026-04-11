import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  FOOTER_PRESETS,
  getMyProfile,
  getProfileAssetUrl,
  uploadProfileAsset,
  validateProfileAsset,
} from '../lib/profiles'
import AuthLayout from '../components/layout/AuthLayout'
import Button from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import LoadingScreen from '../components/LoadingScreen'

const EMPTY_ASSET = {
  file: null,
  path: '',
  previewUrl: '',
  error: '',
  fileName: '',
  isLocalPreview: false,
}

export default function ProfileSetup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [upiId, setUpiId] = useState('')
  const [gstin, setGstin] = useState('')
  const [footerText, setFooterText] = useState('')
  const [logoAsset, setLogoAsset] = useState(EMPTY_ASSET)
  const [signatureAsset, setSignatureAsset] = useState(EMPTY_ASSET)
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
        setLogoAsset({
          ...EMPTY_ASSET,
          path: profile.logo_path ?? '',
          previewUrl: getProfileAssetUrl(profile.logo_path),
          fileName: profile.logo_path ? 'Current logo' : '',
        })
        setSignatureAsset({
          ...EMPTY_ASSET,
          path: profile.signature_path ?? '',
          previewUrl: getProfileAssetUrl(profile.signature_path),
          fileName: profile.signature_path ? 'Current signature' : '',
        })
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

  useEffect(() => {
    return () => {
      if (logoAsset.isLocalPreview && logoAsset.previewUrl) {
        URL.revokeObjectURL(logoAsset.previewUrl)
      }

      if (signatureAsset.isLocalPreview && signatureAsset.previewUrl) {
        URL.revokeObjectURL(signatureAsset.previewUrl)
      }
    }
  }, [logoAsset, signatureAsset])

  function applyFooterPreset(preset) {
    setFooterText(preset)
  }

  function updateAssetSelection(file, kind) {
    const assetLabel = kind === 'logo' ? 'Logo' : 'Signature'
    const validationError = validateProfileAsset(file, assetLabel)

    if (validationError) {
      if (kind === 'logo') {
        setLogoAsset((current) => ({ ...current, error: validationError }))
      } else {
        setSignatureAsset((current) => ({ ...current, error: validationError }))
      }
      return
    }

    const previewUrl = URL.createObjectURL(file)

    if (kind === 'logo') {
      setLogoAsset((current) => {
        if (current.isLocalPreview && current.previewUrl) {
          URL.revokeObjectURL(current.previewUrl)
        }

        return {
          file,
          path: current.path,
          previewUrl,
          error: '',
          fileName: file.name,
          isLocalPreview: true,
        }
      })
      return
    }

    setSignatureAsset((current) => {
      if (current.isLocalPreview && current.previewUrl) {
        URL.revokeObjectURL(current.previewUrl)
      }

      return {
        file,
        path: current.path,
        previewUrl,
        error: '',
        fileName: file.name,
        isLocalPreview: true,
      }
    })
  }

  function handleAssetChange(event, kind) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    updateAssetSelection(file, kind)
  }

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

    if (logoAsset.error || signatureAsset.error) {
      setError('Please resolve the upload issues before saving.')
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

      const nextLogoPath = logoAsset.file
        ? await uploadProfileAsset({ file: logoAsset.file, userId: user.id, kind: 'logo' })
        : logoAsset.path || null

      const nextSignaturePath = signatureAsset.file
        ? await uploadProfileAsset({ file: signatureAsset.file, userId: user.id, kind: 'signature' })
        : signatureAsset.path || null

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedFullName || null,
          business_name: trimmedBusinessName || null,
          upi_id: trimmedUpiId,
          gstin: gstin.trim() || null,
          footer_text: footerText.trim() || null,
          logo_path: nextLogoPath,
          signature_path: nextSignaturePath,
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
      asideCopy="Add the essentials now, then we can move straight into invoice creation and sharing."
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

        <div className="preset-group">
          <span className="field__label">Footer presets</span>
          <div className="chip-row">
            {FOOTER_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`preset-chip ${footerText === preset ? 'preset-chip--active' : ''}`}
                onClick={() => applyFooterPreset(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="asset-grid">
          <label className="asset-card" htmlFor="logo-upload">
            <div className="asset-card__header">
              <span className="field__label">Logo upload</span>
              <span className="asset-card__meta">PNG, JPG, SVG up to 2 MB</span>
            </div>
            {logoAsset.previewUrl ? (
              <div className="asset-preview asset-preview--logo">
                <img src={logoAsset.previewUrl} alt="Logo preview" />
              </div>
            ) : (
              <div className="asset-placeholder">Upload a brand mark for your invoice header.</div>
            )}
            <input
              id="logo-upload"
              type="file"
              accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
              className="asset-input"
              onChange={(event) => handleAssetChange(event, 'logo')}
            />
            <span className="asset-file-name">{logoAsset.fileName || 'No file selected'}</span>
            {logoAsset.error ? <span className="field__error">{logoAsset.error}</span> : null}
          </label>

          <label className="asset-card" htmlFor="signature-upload">
            <div className="asset-card__header">
              <span className="field__label">Signature upload</span>
              <span className="asset-card__meta">Optional stamp or signature</span>
            </div>
            {signatureAsset.previewUrl ? (
              <div className="asset-preview asset-preview--signature">
                <img src={signatureAsset.previewUrl} alt="Signature preview" />
              </div>
            ) : (
              <div className="asset-placeholder">Add a signature or stamp if you want it on the invoice.</div>
            )}
            <input
              id="signature-upload"
              type="file"
              accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
              className="asset-input"
              onChange={(event) => handleAssetChange(event, 'signature')}
            />
            <span className="asset-file-name">{signatureAsset.fileName || 'No file selected'}</span>
            {signatureAsset.error ? <span className="field__error">{signatureAsset.error}</span> : null}
          </label>
        </div>

        {error ? <p className="alert alert--error">{error}</p> : null}

        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save and continue'}
        </Button>
      </form>
    </AuthLayout>
  )
}
