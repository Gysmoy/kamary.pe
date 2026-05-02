import React from 'react'

const MenuItemContainer = ({ title, icon, children, wrapText }) => {

  const refs = []
  if (Array.isArray(children)) {
    children.forEach(child => refs.push(child?.props?.href))
  } else {
    refs.push(children?.props?.href)
  }
  const isExpanded = refs.filter(Boolean).some(x => location.pathname.includes(x))
  const autoWrapText = typeof title === 'string' && title.trim().length >= 20
  const allowWrap = wrapText ?? autoWrapText

  const id = `item-${crypto.randomUUID()}`

  return <li className={`side-nav-item ${isExpanded ? 'active' : ''}`}>
    <a data-bs-toggle="collapse" href={`#${id}`} aria-expanded={isExpanded}
      aria-controls={id} className={`side-nav-link ${isExpanded ? 'active' : ''} ${allowWrap ? 'allow-wrap' : ''}`.trim()}>
      <span className="menu-icon"><i className={icon}></i></span>
      <span className={`menu-text ${allowWrap ? 'menu-text-wrap' : ''}`.trim()}> {title}</span>
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
