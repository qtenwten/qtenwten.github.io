function InlineSpinner({ label = 'Loading' }) {
  return (
    <>
      <span className="inline-spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </>
  )
}

export default InlineSpinner
