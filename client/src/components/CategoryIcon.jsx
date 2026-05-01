const isUrl = (str) => typeof str === 'string' && str.startsWith('http');

// Renders a category icon as either an <img> (S3 URL) or a text/emoji span.
// size: 'xs' | 'sm' | 'md' | 'lg'
const CategoryIcon = ({ icon, size = 'md', className = '' }) => {
  const sizeMap = {
    xs: { img: 'w-5 h-5', text: 'text-base' },
    sm: { img: 'w-7 h-7', text: 'text-xl' },
    md: { img: 'w-9 h-9', text: 'text-2xl' },
    lg: { img: 'w-12 h-12', text: 'text-4xl' },
  };
  const s = sizeMap[size] || sizeMap.md;

  if (isUrl(icon)) {
    return <img src={icon} alt="category icon" className={`${s.img} object-cover rounded-lg inline-block align-middle ${className}`} />;
  }
  return <span className={`${s.text} ${className}`}>{icon || '📚'}</span>;
};

export default CategoryIcon;
