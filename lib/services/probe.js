/**
 * DSH Plugin Hub — the community plugin marketplace for DeepSeek Harness.
 * Website: https://dsh-plugin.org
 * GitHub: https://github.com/dshplugin/dsh-plugin-hub
 *
 * 连通性探测：对单个 HTTPS 目标发 GET，测速并返回 HTTP 状态码。
 *
 * HTTP requests use undici so a minimal DSH image needs no curl executable.
 * Git installs still use the git command with the same proxy settings.
 *
 * 代理来源由调用方决定（routes.ts）：设置里的代理 → 系统代理 → 环境变量 → 直连。
 * systemProxy() 读取操作系统级代理（macOS scutil / Windows 注册表），
 * 使系统代理对 Node 进程可见。
 */
import { spawn, spawnSync } from 'node:child_process';
import { EnvHttpProxyAgent, fetch } from 'undici';
const probeFail = () => ({ ok: false, ms: null, status: null });
/** Git subprocesses read HTTP(S)_PROXY; undici reads the same values. */
function proxyEnv(proxy) {
    if (proxy === '')
        return { ...process.env };
    return {
        ...process.env,
        HTTP_PROXY: proxy,
        HTTPS_PROXY: proxy,
        http_proxy: proxy,
        https_proxy: proxy,
    };
}
/** macOS 系统代理：scutil --proxy 输出里的 HTTP(S) 代理；未开启返回 null。 */
function macSystemProxy() {
    try {
        const out = spawnSync('scutil', ['--proxy'], { encoding: 'utf8', timeout: 1500 });
        if (out.status !== 0)
            return null;
        const txt = out.stdout ?? '';
        const val = (key) => {
            const m = new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, 'm').exec(txt);
            const v = m?.[1]?.trim();
            return v !== undefined && v !== '' ? v : undefined;
        };
        const enabled = (val('HTTPSEnable') ?? val('HTTPEnable')) === '1';
        const host = val('HTTPSProxy') ?? val('HTTPProxy');
        if (!enabled || host === undefined)
            return null;
        const port = val('HTTPSPort') ?? val('HTTPPort') ?? '80';
        if (!/^\d+$/.test(port))
            return null;
        return `http://${host}:${port}`;
    }
    catch {
        return null;
    }
}
/** Windows 系统代理：WinINET Internet 设置注册表；未开启返回 null。 */
function winSystemProxy() {
    try {
        const key = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings';
        const enable = spawnSync('reg', ['query', key, '/v', 'ProxyEnable'], { encoding: 'utf8', timeout: 1500 });
        const server = spawnSync('reg', ['query', key, '/v', 'ProxyServer'], { encoding: 'utf8', timeout: 1500 });
        if (!/0x1/i.test(enable.stdout ?? ''))
            return null;
        const m = /([^:\s=]+):(\d+)/.exec(server.stdout ?? '');
        if (m === null)
            return null;
        return `http://${m[1]}:${m[2]}`;
    }
    catch {
        return null;
    }
}
/**
 * 操作系统级代理（macOS 系统网络设置 / Windows Internet 设置）。
 * Node 内置 http(s) 不读系统代理，浏览器挂的代理 Node 看不见 —— 这里读出来
 * 作为默认代理，保证「浏览器能开、安装/诊断就能通」。
 * Linux 没有统一的系统代理入口，返回 null（交给环境变量 / 设置里的代理）。
 */
export function systemProxy() {
    if (process.platform === 'darwin')
        return macSystemProxy();
    if (process.platform === 'win32')
        return winSystemProxy();
    return null;
}
/** HTTP client shared by catalog fetches and connectivity checks. */
async function requestUrl(url, proxy, timeoutMs) {
    const dispatcher = new EnvHttpProxyAgent({
        httpProxy: proxy || undefined,
        httpsProxy: proxy || undefined,
        noProxy: proxy ? '' : undefined,
    });
    try {
        const response = await fetch(url, { dispatcher, signal: AbortSignal.timeout(timeoutMs) });
        return { status: response.status, body: await response.text() };
    }
    finally {
        await dispatcher.close();
    }
}
/** Probe a HTTP endpoint through the same proxy as catalog requests. */
export async function probeUrl(url, proxy, timeoutMs) {
    let target;
    try {
        target = new URL(url);
    }
    catch {
        return probeFail();
    }
    if (target.protocol !== 'http:' && target.protocol !== 'https:')
        return probeFail();
    const started = Date.now();
    try {
        const { status } = await requestUrl(target.href, proxy, timeoutMs);
        return { ok: status >= 100 && status < 400, ms: Date.now() - started, status, reason: null };
    }
    catch {
        return probeFail();
    }
}
/**
 * git 通道真实克隆握手探测：spawn git ls-remote（https 传输，与 pnpm 克隆前的
 * ref 握手一致），注入代理 env，GIT_TERMINAL_PROMPT=0 防凭据提示挂起。
 *
 * 为什么要真实 git 而非 curl 打网页：网页「能打开」和 git「能克隆」是两码事 ——
 * 防火墙/代理常按端口与协议区分，HTTP 页可达不代表 git 传输可达。这里测的就是
 * 克隆握手本身，回答「github:owner/repo 装不装得动」。
 * 供系统诊断 GitHub 通道使用；探测目标用 dshplugin/hello-dsh 小仓库（秒级完成，
 * 不打 17MB 的 dsh-plugin-hub 主页）。
 */
export function gitLsRemote(url, proxy, timeoutMs) {
    return new Promise((resolve) => {
        const started = Date.now();
        const env = { ...proxyEnv(proxy), GIT_TERMINAL_PROMPT: '0' };
        const child = spawn('git', ['ls-remote', '--exit-code', url, 'HEAD'], { env });
        let out = '';
        child.stdout.on('data', (c) => { out += c.toString(); });
        // git 的报错不透传给终端：结果以退出码 + HEAD ref 是否返回为准
        child.stderr.on('data', () => { });
        let done = false;
        const finish = (r) => {
            if (done)
                return;
            done = true;
            clearTimeout(timer);
            resolve(r);
        };
        child.on('error', () => finish(probeFail()));
        child.on('close', (code) => {
            const ok = code === 0 && out.trim() !== '';
            // status 复用为 git 退出码（0 = 克隆握手成功）；客户端 git 行不把它显示成 HTTP 码
            finish({ ok, ms: Date.now() - started, status: code });
        });
        // 超时兜底：与 curlProbe 同口径，防止 git 挂起
        const timer = setTimeout(() => { child.kill(); finish(probeFail()); }, timeoutMs + 1000);
    });
}
/** Fetch catalog JSON without depending on a curl executable in the host image. */
export async function fetchViaHttp(url, proxy, timeoutMs) {
    try {
        const { status, body } = await requestUrl(url, proxy, timeoutMs);
        return { ok: status >= 200 && status < 300, body, reason: null };
    }
    catch {
        return { ok: false, body: '', reason: null };
    }
}
