import { writeFile } from 'fs'

const prodTargetPath = './src/environments/environment.prod.ts'
const devTargetPath = './src/environments/environment.ts'

writeToPath(prodTargetPath)
writeToPath(devTargetPath)

function writeToPath(path) {
  const envConfigFile = `export const environment = {
    production: ${path === prodTargetPath},
    mapbox: {
      token: '${process.env.MAPBOX_TOKEN}'
    }
  };`
  writeFile(path, envConfigFile, 'utf8', (err) => {
    if (err) {
      return console.log(err)
    }
  })
}
