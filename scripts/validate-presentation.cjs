const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')

const cache = new Map()
function loadSource(file) {
  const absolute = path.resolve(__dirname, '..', 'src', 'components', 'simulator', file + '.ts')
  if (cache.has(absolute)) return cache.get(absolute).exports
  const compiled = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const loaded = new Module(absolute, module)
  loaded.filename = absolute
  loaded.paths = Module._nodeModulePaths(path.dirname(absolute))
  cache.set(absolute, loaded)
  loaded.require = (name) => name.startsWith('./') ? loadSource(path.join(path.dirname(file), name)) : require(name)
  loaded._compile(compiled, absolute)
  return loaded.exports
}

const { createMissionStore } = loadSource('mission')
const { createPresentationController } = loadSource('presentation')
const store = createMissionStore()
const presentation = createPresentationController(store)
const step = () => { store.advance(.5); presentation.advance(.5) }
const advanceUntil = (condition, maxSteps = 320) => {
  for (let index = 0; index < maxSteps && !condition(); index++) step()
  assert.ok(condition(), `Hito no alcanzado: ${presentation.getSnapshot().scene} / ${presentation.getSnapshot().status}`)
}

presentation.start()
assert.equal(store.getSnapshot().phase, 'idle')
assert.equal(store.getSnapshot().network.reports.length, 0)
assert.equal(presentation.getSnapshot().scene, 'emergency')
advanceUntil(() => presentation.getSnapshot().scene === 'hugin')
assert.equal(store.getSnapshot().phase, 'running')

presentation.pause()
const pausedTime = store.getClock()
for (let index = 0; index < 8; index++) step()
assert.equal(store.getClock(), pausedTime)
assert.equal(presentation.getSnapshot().scene, 'hugin')
presentation.resume()
advanceUntil(() => presentation.getSnapshot().scene === 'munin')
assert.ok(store.getSnapshot().recognizedIds.includes('north'))
assert.ok(store.getSnapshot().network.reports.some((report) => report.origin === 'HUGIN'))
advanceUntil(() => store.getSnapshot().network.failed)
assert.ok(store.getSnapshot().network.isolatedSectorIds.includes('west'))
assert.ok(store.getSnapshot().network.reports.some((report) => report.sectorId === 'west' && report.status !== 'Recibido'))
const isolatedId = presentation.getSnapshot().isolatedReportId
assert.ok(isolatedId)
assert.equal(store.getSnapshot().network.reports.find((report) => report.id === isolatedId).receivedAt, null)
advanceUntil(() => store.getSnapshot().network.messengerStatus === 'Transportando')
assert.equal(store.getSnapshot().network.reports.find((report) => report.id === isolatedId).status, 'En tránsito')
advanceUntil(() => presentation.getSnapshot().scene === 'iscat')
assert.equal(store.getSnapshot().network.reports.find((report) => report.id === isolatedId).location, 'hub')
assert.equal(store.getSnapshot().network.messengerStatus, 'Finalizado')
assert.equal(store.getSnapshot().recognizedIds.length, 5)

advanceUntil(() => presentation.getSnapshot().scene === 'collective')
const acousticBefore = store.getSnapshot().network.reports.find((report) => report.id === 'RPT-ISCAT-02')
assert.ok(acousticBefore?.requiresVerification)
assert.notEqual(acousticBefore.status, 'Recibido')
assert.equal(acousticBefore.receivedAt, null)
assert.ok(store.getSnapshot().network.reports.some((report) => report.id === 'RPT-ISCAT-03'))
const baseline = presentation.getSnapshot().baselineUrgency
assert.equal(store.getSnapshot().collective.sectors.find((sector) => sector.sectorId === 'west').urgency, baseline)
assert.ok(!store.getSnapshot().collective.changes.some((change) => change.reportId === acousticBefore.id))
advanceUntil(() => store.getSnapshot().network.reports.find((report) => report.id === acousticBefore.id)?.status === 'Recibido')
assert.ok(store.getSnapshot().collective.changes.some((change) => change.reportId === acousticBefore.id))
assert.notEqual(store.getSnapshot().collective.sectors.find((sector) => sector.sectorId === 'west').urgency, baseline)
advanceUntil(() => presentation.getSnapshot().status === 'finished')
assert.equal(presentation.getSnapshot().scene, 'closing')
assert.equal(presentation.getSnapshot().progress, 100)
assert.ok(presentation.getSnapshot().elapsed >= 90 && presentation.getSnapshot().elapsed <= 130)
const fullDuration = presentation.getSnapshot().elapsed

presentation.repeat()
assert.equal(presentation.getSnapshot().scene, 'emergency')
assert.equal(store.getSnapshot().network.reports.length, 0)
assert.equal(store.getSnapshot().events.length, 0)
advanceUntil(() => store.getSnapshot().recognizedIds.includes('north'))
assert.equal(store.getSnapshot().network.reports.filter((report) => report.sectorId === 'north' && report.origin === 'HUGIN').length, 1)
presentation.cancel()
assert.equal(presentation.getSnapshot().status, 'idle')
assert.notEqual(store.getSnapshot().phase, 'paused')

console.log(`Presentación: secuencia, entrega real, recálculo, pausa, cancelación y repetición verificados; duración simulada ${Math.round(fullDuration)} s.`)
