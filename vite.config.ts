import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Actions fournit GITHUB_REPOSITORY sous la forme "proprietaire/nom-du-depot".
// Le site publié est alors servi sous /nom-du-depot/. En local, la base reste /.
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.GITHUB_ACTIONS === 'true' && repository
  ? `/${repository}/`
  : '/'

export default defineConfig({
  plugins: [react()],
  base,
})
