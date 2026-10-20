import { ArrowUpRight } from 'lucide-react'
import { Icon, cx } from './ui'

/** Card de categoría con ícono lineal. Props: category {slug,name,icon,description,count} */
export default function CategoryCard({ category, className }) {
  return (
    <a href={`/categoria-producto/${category.slug}`}
      className={cx('group flex h-full flex-col justify-between gap-8 rounded-[20px] border border-kf-line bg-white p-6 transition-all hover:border-kf-navy hover:shadow-[0_8px_30px_rgba(15,19,31,0.06)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-kf-blue', className)}>
      <div className="flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-kf-surface text-kf-navy transition-colors group-hover:bg-kf-navy group-hover:text-white">
          <Icon name={category.icon} size={22} />
        </span>
        <ArrowUpRight size={18} className="text-kf-muted transition-colors group-hover:text-kf-red" />
      </div>
      <div>
        <h3 className="text-lg font-semibold tracking-[-0.01em] text-kf-ink">{category.name}</h3>
        {category.count != null && (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-kf-muted">{category.count} productos</p>
        )}
      </div>
    </a>
  )
}
