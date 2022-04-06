import * as Fixtures from '@tooling/system-tests/lib/fixtures'
import * as FixturesScaffold from '@tooling/system-tests/lib/dep-installer'
import type { e2eProjectDirs } from '@packages/frontend-shared/cypress/e2e/support/e2eProjectDirs'
import { expect } from 'chai'
import path from 'path'
import fs from 'fs'

import { restoreLoadHook, sourceRelativeWebpackModules } from '../src/helpers/sourceRelativeWebpackModules'
import { WebpackDevServerConfig } from '../src/devServer'

type ProjectDirs = typeof e2eProjectDirs

const CY_ROOT = path.join(__dirname, '..', '..', '..')

const WEBPACK_REACT: Partial<Record<ProjectDirs[number], {
  webpack: number
  webpackDevServer: number
  htmlWebpackPlugin: number
}>> = {
  'webpack4_wds3-react': {
    webpack: 4,
    webpackDevServer: 3,
    htmlWebpackPlugin: 4,
  },
  'webpack4_wds4-react': {
    webpack: 4,
    webpackDevServer: 4,
    htmlWebpackPlugin: 4,
  },
  'webpack5_wds3-react': {
    webpack: 5,
    webpackDevServer: 3,
    htmlWebpackPlugin: 5,
  },
  'webpack5_wds4-react': {
    webpack: 5,
    webpackDevServer: 4,
    htmlWebpackPlugin: 5,
  },
}

async function sourceModulesForProject (fixture: ProjectDirs[number]) {
  Fixtures.remove()
  const projectRoot = await Fixtures.scaffoldProject(fixture)

  await FixturesScaffold.scaffoldProjectNodeModules(fixture)

  const result = sourceRelativeWebpackModules({
    cypressConfig: {
      projectRoot,
    },
  } as WebpackDevServerConfig)

  return { result, projectRoot }
}

// Ensures that we are properly sourcing the webpacks from the node_modules in the given project,
// rather than from the node_modules in the project root
describe('sourceRelativeWebpackModules', () => {
  beforeEach(() => {
    delete require.cache
    restoreLoadHook()
  })

  after(() => {
    restoreLoadHook()
  })

  for (const [fixture, versionsToMatch] of Object.entries(WEBPACK_REACT)) {
    describe(fixture, () => {
      it(`sources the correct webpack versions for ${fixture}`, async () => {
        const { result, projectRoot } = await sourceModulesForProject(fixture as ProjectDirs[number])
        const projectNodeModules = fs.realpathSync(path.resolve(projectRoot, 'node_modules'))

        expect(result.webpack.majorVersion).to.eq(versionsToMatch.webpack, 'match webpackVersion')
        expect(result.webpackDevServer.majorVersion).to.eq(versionsToMatch.webpackDevServer, 'match webpackDevServerVersion')
        expect(result.webpack.importPath).to.include(projectNodeModules)
        expect(result.webpackDevServer.importPath).to.include(projectNodeModules)
      })
    })
  }

  it('sources the webpack path from the correct location once imported', async () => {
    expect(require.resolve('webpack')).to.include(CY_ROOT)
    const localWebpack = require('webpack')

    const { result, projectRoot } = await sourceModulesForProject('webpack4_wds3-react')
    const projectNodeModules = fs.realpathSync(path.resolve(projectRoot, 'node_modules'))

    expect(localWebpack).not.to.eq(result.webpack.module)
    expect(result.webpack.importPath).to.include(projectNodeModules)
    expect(result.webpack.majorVersion).to.eq(4, 'match webpackVersion')
    expect(require('webpack')).to.eq(result.webpack.module)
    expect(require.resolve('webpack')).to.include(projectNodeModules)
  })
})