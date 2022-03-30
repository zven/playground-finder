import { writeFile } from 'fs'

const targetPath = './src/environments/environment.prod.ts'
const envConfigFile = `export const environment = {
  production: true,
  mapbox: {
    token: '${process.env.MAPBOX_TOKEN}'
  }
};`

writeFile(targetPath, envConfigFile, 'utf8', (err) => {
  if (err) {
    return console.log(err)
  }
})
