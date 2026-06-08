import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function MindmapPage() {
  const html = fs.readFileSync(path.join(process.cwd(), 'public/project-mindmap.html'), 'utf8')
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
