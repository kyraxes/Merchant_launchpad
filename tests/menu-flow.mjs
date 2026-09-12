// Starts an isolated local server with in-memory fixtures. Never calls a deployed site.
// Run after pnpm build: node tests/menu-flow.mjs
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { priceMinor, canPublish, parseMenuRows } from "../lib/menu.ts";

assert.equal(priceMinor("60.50"), 6050);
for (const price of ["", "60/80", "-10", "NaN", "0", "1.234", "1e3"]) assert.equal(priceMinor(price), null);
assert.throws(() => parseMenuRows([{ name: "bad" }]));
assert.equal(canPublish([]), false);

const probe = createServer().listen(0, "127.0.0.1");
await once(probe, "listening");
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const base = `http://127.0.0.1:${port}`;
const testAdmin = "isolated-menu-test-key";
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  windowsHide: true,
  env: { ...process.env, MERCHANT_STORAGE: "memory", ALLOW_MOCK_LINE_AUTH: "true", ADMIN_API_KEY: testAdmin, NEXT_PUBLIC_SITE_URL: base, URL: base },
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
server.stdout.on("data", data => { logs = (logs + data).slice(-6000); });
server.stderr.on("data", data => { logs = (logs + data).slice(-6000); });
let browser;
let checks = 0;
async function call(path, options = {}, expected = 200) {
  const response = await fetch(base + path, { ...options, signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, expected, `${options.method || "GET"} ${path}: ${await response.clone().text()}`);
  checks++;
  return response;
}
const auth = { authorization: "Bearer mock-line:menu-owner" };
const post = (body, headers = auth) => ({ method: "POST", headers: { ...headers, origin: base, "content-type": "application/json" }, body: JSON.stringify(body) });
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(logs);
    try { if ((await fetch(base + "/zh", { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch {}
    await delay(200);
  }
  assert.ok(ready, logs);
  const created = await (await call("/api/submissions", post({ clientSubmissionId: "menu-test", locale: "zh", name: "Menu Test ร้านทดสอบ", category: "Restaurant", address: "Bangkok test address", phone: "0800000000", hours: "09:00–20:00", lineId: "", images: {} }), 201)).json();
  const id = created.submission.id;
  const endpoint = `/api/submissions/${id}/menu`;
  const publicPath = `/zh/stores/${id}/menu`;
  const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
  await call(endpoint, {}, 401);
  await call(endpoint, { headers: { authorization: "Bearer mock-line:another-owner" } }, 404);
  await call(endpoint, { ...post({ action: "import", revision: 0, images: [image] }), headers: { ...auth, origin: "https://other.example", "content-type": "application/json" } }, 403);
  await call(endpoint, post({ action: "import", revision: 0, images: Array(6).fill(image) }), 422);
  let menu = (await (await call(endpoint, post({ action: "import", revision: 0, images: [image] }))).json()).menu;
  assert.equal(menu.rows[1].price, "");
  assert.equal(menu.source, "mock");
  await call(publicPath, {}, 404);
  await call(endpoint, post({ action: "publish", revision: menu.revision, rows: menu.rows }), 409);
  const adminHeaders = { "x-admin-key": testAdmin, origin: base, "content-type": "application/json" };
  async function approve(status) { await call(`/api/admin/submissions/${id}`, { method: "PATCH", headers: adminHeaders, body: JSON.stringify({ status }) }); }
  await approve("approved");
  await call(endpoint, post({ action: "publish", revision: menu.revision, rows: menu.rows }), 422);
  let rows = menu.rows.map(row => ({ ...row, price: row.price || "80", confirmed: true }));
  await call(endpoint, post({ action: "publish", revision: menu.revision, rows: rows.map(row => ({ ...row, price: "-10" })) }), 422);
  menu = (await (await call(endpoint, post({ action: "publish", revision: menu.revision, rows }))).json()).menu;
  const publicHTML = await (await call(publicPath)).text();
  assert.ok(publicHTML.includes("Fried rice"));
  assert.ok(!publicHTML.includes("data:image/png"));
  assert.ok(publicHTML.includes("noindex"));
  assert.ok((await (await call(`/zh/stores/${id}`)).text()).includes(`/zh/stores/${id}/menu`));
  const priorRevision = menu.revision;
  rows = rows.map((row, index) => index ? row : { ...row, name: "Only in private edits" });
  menu = (await (await call(endpoint, post({ action: "save", revision: priorRevision, rows }))).json()).menu;
  await call(endpoint, post({ action: "save", revision: priorRevision, rows }), 409);
  assert.equal((await (await call(endpoint, { headers: auth })).json()).menu.rows[0].name, "Only in private edits");
  assert.ok(!(await (await call(publicPath)).text()).includes("Only in private edits"));
  const attempts = await Promise.all([fetch(base + endpoint, post({ action: "save", revision: menu.revision, rows })), fetch(base + endpoint, post({ action: "save", revision: menu.revision, rows }))]);
  assert.deepEqual(attempts.map(response => response.status).sort(), [200, 409]);
  menu = (await (await call(endpoint, { headers: auth })).json()).menu;
  menu = (await (await call(endpoint, post({ action: "import", revision: menu.revision, images: [image] }))).json()).menu;
  assert.ok((await (await call(publicPath)).text()).includes("Fried rice"));


  // Website accounts: opaque cookies, server ownership and legacy migration.
  const password = "menu-test-password-42";
  await call("/api/account/session", post({ action: "register", username: "web-owner", password: "short" }), 422);
  const registered = await call("/api/account/session", post({ action: "register", username: "web-owner", password }));
  const cookieHeader = registered.headers.get("set-cookie");
  assert.ok(cookieHeader.includes("HttpOnly") && cookieHeader.includes("SameSite=strict"));
  const cookie = cookieHeader.split(";")[0];
  assert.equal((await (await call("/api/account/session")).json()).user, null);
  await call("/api/account/session", post({ action: "register", username: "WEB-OWNER", password }), 409);
  await call("/api/account/session", post({ action: "login", username: "web-owner", password: "wrong-password-value" }), 401);
  await call(endpoint, { headers: { cookie } }, 404);
  await call("/api/admin/accounts/link", post({ username: "web-owner", merchantId: id }, { cookie }), 401);
  await call("/api/admin/accounts/link", post({ username: "web-owner", merchantId: id }, adminHeaders));
  assert.equal((await (await call(endpoint, { headers: { cookie } })).json()).menu.revision, menu.revision);
  await call(endpoint, { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ action: "save", revision: menu.revision, rows: menu.rows }) }, 403);
  const other = await call("/api/account/session", post({ action: "register", username: "other-owner", password }));
  const otherCookie = other.headers.get("set-cookie").split(";")[0];
  await call(endpoint, { headers: { cookie: otherCookie } }, 404);
  await call("/api/admin/accounts/link", post({ username: "other-owner", merchantId: id }, adminHeaders), 409);
  await call("/api/account/session", { method: "DELETE", headers: { cookie: otherCookie, origin: base } });
  assert.equal((await (await call("/api/account/session", { headers: { cookie: otherCookie } })).json()).user, null);

  const newAccount = await call("/api/account/session", post({ action: "register", username: "new-merchant", password }));
  const newCookie = newAccount.headers.get("set-cookie").split(";")[0];
  const newBody = { clientSubmissionId: "website-create", locale: "en", name: "Website Store", category: "Cafe", address: "Bangkok", phone: "0800000001", hours: "10:00–18:00", images: {} };
  const newMerchant = (await (await call("/api/submissions", post(newBody, { cookie: newCookie }), 201)).json()).submission;
  await call("/api/submissions", post({ ...newBody, clientSubmissionId: "another", name: "Another Store", phone: "0800000002" }, { cookie: newCookie }), 409);
  await call(`/api/submissions/${newMerchant.id}/menu`, { headers: { cookie } }, 404);
  await call("/api/admin/accounts/link", post({ username: "new-merchant", merchantId: id }, adminHeaders), 409);
  const listed = (await (await call("/api/submissions", { headers: { cookie: newCookie } })).json()).submissions;
  assert.equal(listed.length, 1);
  assert.equal(listed[0].id, newMerchant.id);

  for (let attempt = 0; attempt < 12; attempt++) await call("/api/account/session", post({ action: "login", username: "limited-user", password }), 401);
  await call("/api/account/session", post({ action: "login", username: "limited-user", password }), 429);

  // Optional real browser checks using an externally supplied Playwright install.
  if (process.env.PLAYWRIGHT_MODULE) {
    const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const lineRequests = []; page.on("request", request => { if (/line\\.me|line-scdn/.test(request.url())) lineRequests.push(request.url()); });
    for (const locale of ["zh", "th", "en"]) {
      await page.goto(`${base}/${locale}/stores/${id}/menu`);
      await page.getByRole("heading", { name: "Menu Test ร้านทดสอบ", exact: true }).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    }
    const folder = await mkdtemp(join(tmpdir(), "merchant-menu-test-"));
    await page.goto(base + publicPath);
    await page.screenshot({ path: join(folder, "public-menu-mobile.png"), fullPage: true });
    await page.goto(base + "/zh/menu");
    await page.getByRole("heading", { name: "请登录网站账号", exact: true }).waitFor();
    assert.equal(await page.getByText("确认并发布", { exact: true }).count(), 0);
    await page.goto(base + "/zh");
    await page.getByRole("heading", { name: "创建线上菜单", exact: true }).waitFor();

    // Real website sign-in and real editor, with no LINE SDK or context mocks.
    await page.goto(base + "/zh/login");
    await page.getByLabel("用户名", { exact: true }).fill("web-owner");
    await page.getByLabel("密码", { exact: true }).fill(password);
    await page.getByRole("button", { name: "登录", exact: true }).click();
    await page.waitForURL("**/zh/menu");
    await page.getByText("已与服务器同步", { exact: true }).waitFor();
    await page.getByLabel("价格（฿）", { exact: true }).nth(1).fill("85");
    await page.getByLabel("菜名", { exact: true }).first().fill("手机校对菜品");
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    assert.equal(await page.getByLabel("菜名", { exact: true }).first().inputValue(), "手机校对菜品");
    await page.getByRole("button", { name: "保存校对", exact: true }).click();
    await page.getByText("已保存到服务器，尚未更新公开菜单。", { exact: true }).waitFor();
    await page.reload();
    await page.getByText("已与服务器同步", { exact: true }).waitFor();
    assert.equal(await page.getByLabel("菜名", { exact: true }).first().inputValue(), "手机校对菜品");
    for (const checkbox of await page.getByLabel("已核对菜名、规格和价格", { exact: true }).all()) await checkbox.check();
    await page.getByRole("button", { name: "确认并发布", exact: true }).click();
    await page.getByText("发布成功，顾客可以打开菜单了。", { exact: true }).waitFor();
    assert.ok((await (await call(publicPath)).text()).includes("手机校对菜品"));
    await page.getByLabel("选择菜单照片（最多 5 张）", { exact: true }).setInputFiles("public/test-data/mock-menu.png");
    await page.getByText("照片还未上传。点击“上传并模拟识别”后再校对。", { exact: true }).first().waitFor();
    assert.equal(await page.getByRole("button", { name: "确认并发布", exact: true }).isDisabled(), true);
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "上传并模拟识别", exact: true }).click();
    await page.getByText("已保存到服务器，尚未更新公开菜单。", { exact: true }).waitFor();
    assert.equal(await page.getByLabel("价格（฿）", { exact: true }).nth(1).inputValue(), "");
    assert.ok((await (await call(publicPath)).text()).includes("手机校对菜品"));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.screenshot({ path: join(folder, "menu-editor-mobile.png"), fullPage: true });
    menu = (await (await call(endpoint, { headers: auth })).json()).menu;
    assert.equal(lineRequests.length, 0, "Website must not depend on LINE");
    console.log("Browser checks passed; screenshot:", join(folder, "public-menu-mobile.png"));
  }

  await approve("review");
  await call(publicPath, {}, 404);
  await approve("approved");
  menu = (await (await call(endpoint, post({ action: "unpublish", revision: menu.revision }))).json()).menu;
  await call(publicPath, {}, 404);
  assert.equal(menu.rows.length, 3);
  await call(`/api/admin/submissions/${id}`, { method: "DELETE", headers: adminHeaders }, 204);
  await call(endpoint, { headers: auth }, 404);
  const recreated = await (await call("/api/submissions", post({ clientSubmissionId: "menu-test-2", locale: "zh", name: "Recreated", category: "Restaurant", address: "Bangkok", phone: "0800000000", hours: "09:00–20:00", images: {} }), 201)).json();
  assert.equal(recreated.submission.id, id);
  assert.equal((await (await call(endpoint, { headers: auth })).json()).menu.revision, 0);
  console.log(`PASS: ${checks} HTTP checks plus validation, concurrency and publication assertions.`);
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  if (browser) await browser.close();
  server.kill();
}
