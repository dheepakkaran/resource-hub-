import {
  Code2, Video, FileText, BookOpen, Palette, Zap,
  Globe, Cpu, Star, Users, GraduationCap, Archive,
  Image, Music, Database, Layout
} from 'lucide-react'

const MAP = {
  code:         { icon: Code2 },
  video:        { icon: Video },
  article:      { icon: FileText },
  research:     { icon: BookOpen },
  design:       { icon: Palette },
  productivity: { icon: Zap },
  social:       { icon: Users },
  reference:    { icon: Globe },
  learning:     { icon: GraduationCap },
  document:     { icon: FileText },
  image:        { icon: Image },
  audio:        { icon: Music },
  archive:      { icon: Archive },
  database:     { icon: Database },
  docs:         { icon: Layout },
}

export default function CategoryIcon({ category, size = 18 }) {
  const { icon: Icon } = MAP[category] || { icon: Star }
  return <Icon size={size} className="text-gray-500" />
}
