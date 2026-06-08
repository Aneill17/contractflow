import fs from 'fs'
import path from 'path'

export default function MindmapPage() {
  const html = fs.readFileSync(path.join(process.cwd(), 'public/project-mindmap.html'), 'utf8')
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
