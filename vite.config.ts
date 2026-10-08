import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]

export default defineConfig({
  plugins: [react()],
  base: repositoryName ? `/${repositoryName}/` : '/',
  test: {
    environment: 'node',
  },
})
