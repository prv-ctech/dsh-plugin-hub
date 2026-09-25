/**
 * DSH Plugin Hub — the community plugin marketplace for DeepSeek Harness.
 * Website: https://dsh-plugin.org
 * GitHub: https://github.com/dshplugin/dsh-plugin-hub
 *
 * 连通性探测（probeUrl / systemProxy / catalog HTTP client）的单元测试。
 *
 * probeUrl 走真实网络（Node HTTP，走代理或直连），与 npm-resolve 一样标注
 * skip 策略：默认跳过（本机直连 GitHub/npm 常不通，会等满超时才失败、看着像卡死），
 * 显式设 DSH_HUB_TEST_ONLINE=1 才跑真实网络测试。systemProxy 依赖本机系统代理
 * 设置，只在确实读取到代理时断言格式。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchViaHttp, gitLsRemote, probeUrl, systemProxy } from '../src/server/services/probe.ts'
import { createServer } from 'node:http'

const ONLINE = process.env.DSH_HUB_TEST_ONLINE === '1'

test('catalog fetch uses Node HTTP without curl and rejects HTTP failures', async () => {
  const server = createServer((req, res) => {
    res.writeHead(req.url === '/ok' ? 200 : 503, { 'content-type': 'application/json' })
    res.end(req.url === '/ok' ? '{"total":2,"verified":1}' : '{"error":"unavailable"}')
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  const oldPath = process.env.PATH
  process.env.PATH = '/nonexistent'
  try {
    const base = `http://127.0.0.1:${address.port}`
    assert.deepEqual(await fetchViaHttp(`${base}/ok`, '', 1000), {
      ok: true, body: '{"total":2,"verified":1}', reason: null,
    })
    assert.equal((await fetchViaHttp(`${base}/fail`, '', 1000)).ok, false)
    assert.equal((await probeUrl(`${base}/ok`, '', 1000)).status, 200)
  } finally {
    if (oldPath === undefined) delete process.env.PATH
    else process.env.PATH = oldPath
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})

test('configured HTTP proxy is used for catalog and diagnostics', async () => {
  let requests = 0
  const proxy = createServer((_req, res) => {
    requests += 1
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end('{"total":2,"verified":1}')
  })
  proxy.on('connect', (_req, socket) => {
    requests += 1
    socket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
    socket.once('data', () => {
      const body = '{"total":2,"verified":1}'
      socket.end(`HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`)
    })
  })
  await new Promise<void>((resolve) => proxy.listen(0, '127.0.0.1', resolve))
  const address = proxy.address()
  assert.ok(address && typeof address !== 'string')
  try {
    const proxyUrl = `http://127.0.0.1:${address.port}`
    assert.equal((await fetchViaHttp('http://catalog.invalid/stats.json', proxyUrl, 1000)).ok, true)
    assert.equal((await probeUrl('http://catalog.invalid/stats.json', proxyUrl, 1000)).ok, true)
    assert.equal(requests, 2)
  } finally {
    await new Promise<void>((resolve) => proxy.close(() => resolve()))
  }
})

test('probeUrl: 非法 URL 直接不可达，不抛错', async () => {
  const r = await probeUrl('not a url', '', 1000)
  assert.equal(r.ok, false)
  assert.equal(r.ms, null)
})

test('probeUrl: 对不存在的代理走 HTTP 客户端，应归为不可达', async () => {
  const r = await probeUrl('https://registry.npmjs.org/dsh-plugin', 'http://127.0.0.1:1', 1500)
  assert.equal(r.ok, false)
  // 连不上代理 ≠ 证书吊销受阻：不能顺带给 reason，否则诊断会指向错误的排查方向
  assert.equal(r.reason ?? null, null)
})

test('probeUrl: 无代理直连已知站点（本地断网时跳过）', { skip: !ONLINE }, async () => {
  const r = await probeUrl('https://registry.npmjs.org/dsh-plugin', '', 6000)
  assert.equal(r.ok, true)
  assert.equal(r.status, 200)
})

test('gitLsRemote: 对不存在的代理走真实 git 握手，应归为不可达', async () => {
  const r = await gitLsRemote('https://github.com/dshplugin/hello-dsh', 'http://127.0.0.1:1', 1500)
  assert.equal(r.ok, false)
})

test('gitLsRemote: 直连测试仓库返回真实克隆握手（本地断网时跳过）', { skip: !ONLINE }, async () => {
  const r = await gitLsRemote('https://github.com/dshplugin/hello-dsh', '', 8000)
  assert.equal(r.ok, true)
  assert.equal(r.status, 0)
})

test('systemProxy: 读到的代理必须是 http://host:port 形态（读不到时返回 null 也可接受）', () => {
  const p = systemProxy()
  if (p !== null) {
    assert.match(p, /^http:\/\/.+/)
    assert.ok(Number(p.slice(p.lastIndexOf(':') + 1)) > 0)
  }
})
