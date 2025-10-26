const docsifyCli = require('docsify-cli/lib/commands/serve.js')

function runDocsifyRenderer({ docsifyRendererPort, docsifyLiveReloadPort, pathToDocsifyEntryPoint }) {
  return () => {
    docsifyCli(pathToDocsifyEntryPoint, false, docsifyRendererPort, docsifyLiveReloadPort)
  }
}

module.exports = ({ docsifyRendererPort, docsifyLiveReloadPort, pathToDocsifyEntryPoint }) => ({
  runDocsifyRenderer: runDocsifyRenderer({
    docsifyRendererPort,
    docsifyLiveReloadPort,
    pathToDocsifyEntryPoint,
  }),
})
