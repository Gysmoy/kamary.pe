import React from 'react'

const MenuItemContainer = ({ title, icon, children }) => {

  const refs = []
  if (Array.isArray(children)) {
    children.forEach(child => refs.push(child?.props?.href))
  } else {
    refs.push(children?.props?.href)
  }
  const isExpanded = refs.filter(Boolean).some(x => location.pathname.includes(x))
  const id = `item-${crypto.randomUUID()}`

  return <li className={`side-nav-item ${isExpanded ? 'active' : ''}`}>
    <a data-bs-toggle="collapse" href={`#${id}`} aria-expanded={isExpanded}
      aria-controls={id} className={`side-nav-link ${isExpanded ? 'active' : ''}`.trim()}>
      <span className="menu-icon"><i className={icon}></i></span>
      <span className="menu-text">{title}</span>
      <span className="menu-arrow"></span>
    </a>
    <div className={`collapse ${isExpanded && 'show'}`} id={id}>
      <ul className="sub-menu">
        {children}
      </ul>
    </div>
  </li>
}

export default MenuItemContainer
