import React from 'react'

const MenuItem = ({ href, icon, badge = null, badgeColor = 'success', children, onClick, exact = false }) => {
  const currentPath = location.pathname.replace(/\/+$/, '') || '/'
  const targetPath = href.replace(/\/+$/, '') || '/'
  const isActive = exact
    ? currentPath === targetPath
    : currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
  const Container = ({ className, children: content }) => {
    if (onClick) return <div onClick={onClick} className={className} style={{ cursor: 'pointer' }}>{content}</div>
    else return <a href={href} className={className}>{content}</a>
  }

  return <li className={`side-nav-item ${isActive ? 'active' : ''}`}>
    <Container className={`side-nav-link ${isActive ? 'active' : ''}`.trim()}>
      <span className="menu-icon"><i className={icon}></i></span>
      <span className="menu-text">{children}</span>
      {
        badge && <span className={`badge bg-${badgeColor} rounded-pill`}>{badge}</span>
      }
    </Container>
  </li>
}

export default MenuItem
