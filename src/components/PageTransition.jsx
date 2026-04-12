function PageTransition({ routeKey, children }) {
  return (
    <div className="page-transition-wrapper" key={routeKey}>
      {children}
    </div>
  )
}

export default PageTransition
