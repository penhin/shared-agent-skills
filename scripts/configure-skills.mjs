#!/usr/bin/env node
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync, lstatSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = createInterface({ input, output });
const home = os.homedir();
const isWindows = process.platform === "win32";
const manifestName = ".shared-agent-skills.json";

const agents = {
  codex: { label: "Codex", target: path.join(home, ".agents", "skills") },
  pi: { label: "Pi", target: path.join(home, ".agents", "skills") },
  claude: { label: "Claude Code", target: path.join(home, ".claude", "skills") },
};

async function ask(question, fallback = "") {
  const answer = (await rl.question(`${question}${fallback ? ` [${fallback}]` : ""}: `)).trim();
  return answer || fallback;
}

async function skillDirectories(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const skills = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const directory = path.join(root, entry.name);
    if (existsSync(path.join(directory, "SKILL.md"))) skills.push({ name: entry.name, directory });
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

function parseSelection(value, skills) {
  if (!value || value.toLowerCase() === "all" || value === "全部") return skills;
  const selected = new Set();
  for (const token of value.split(/[\s,，]+/)) {
    if (/^\d+$/.test(token)) {
      const skill = skills[Number(token) - 1];
      if (skill) selected.add(skill);
      continue;
    }
    const match = token.match(/^(\d+)-(\d+)$/);
    if (match) {
      for (let i = Number(match[1]); i <= Number(match[2]); i += 1) {
        if (skills[i - 1]) selected.add(skills[i - 1]);
      }
      continue;
    }
    const skill = skills.find((candidate) => candidate.name === token);
    if (skill) selected.add(skill);
  }
  return skills.filter((skill) => selected.has(skill));
}

async function removeManagedLinks(target) {
  const manifestPath = path.join(target, manifestName);
  if (!existsSync(manifestPath)) return;
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  for (const name of manifest.skills ?? []) {
    const link = path.join(target, name);
    if (existsSync(link) || lstatSafe(link)) await fs.rm(link, { recursive: true, force: true });
  }
  await fs.rm(manifestPath, { force: true });
}

function lstatSafe(file) {
  try { return lstatSync(file); } catch { return null; }
}

async function configureAgent(agent, selected, source) {
  const target = agent.target;
  const existing = lstatSafe(target);
  if (existing?.isSymbolicLink()) {
    throw new Error(`${target} 已经是外部链接，请先处理它后再配置，程序不会自动替换。`);
  }
  await fs.mkdir(target, { recursive: true });
  await removeManagedLinks(target);

  const installed = [];
  for (const skill of selected) {
    const destination = path.join(target, skill.name);
    if (existsSync(destination) || lstatSafe(destination)) {
      console.log(`  跳过 ${skill.name}: 目标已存在且不由本程序管理`);
      continue;
    }
    if (isWindows) await fs.symlink(skill.directory, destination, "junction");
    else await fs.symlink(skill.directory, destination, "dir");
    installed.push(skill.name);
  }
  await fs.writeFile(
    path.join(target, manifestName),
    `${JSON.stringify({ source, skills: installed, configuredAt: new Date().toISOString() }, null, 2)}\n`,
  );
  return { target, installed };
}

try {
  console.log("\nShared Agent Skills 配置向导\n");
  const defaultRoot = process.cwd();
  const source = path.resolve(await ask("skill 仓库或 .agents/skills 文件夹路径", defaultRoot));
  const sourceRoot = existsSync(path.join(source, ".agents", "skills"))
    ? path.join(source, ".agents", "skills")
    : source;
  if (!existsSync(sourceRoot)) throw new Error(`路径不存在: ${sourceRoot}`);

  const skills = await skillDirectories(sourceRoot);
  if (!skills.length) throw new Error(`没有找到直接包含 SKILL.md 的 skill: ${sourceRoot}`);
  console.log(`\n发现 ${skills.length} 个 skill:`);
  skills.forEach((skill, index) => console.log(`  ${index + 1}. ${skill.name}`));

  const selection = parseSelection(await ask("选择 skill（all/全部、编号、范围或名称）", "all"), skills);
  if (!selection.length) throw new Error("没有选择任何 skill。");
  const agentInput = await ask("配置哪些 agent（codex, pi, claude，可逗号分隔）", "codex,pi,claude");
  const selectedAgents = [...new Set(agentInput.split(/[\s,，]+/).map((name) => name.toLowerCase()))]
    .map((name) => agents[name])
    .filter(Boolean);
  if (!selectedAgents.length) throw new Error("没有选择有效的 agent。");

  console.log(`\n将配置 ${selection.length} 个 skill 到: ${selectedAgents.map((agent) => agent.label).join(", ")}`);
  if ((await ask("确认执行", "y")).toLowerCase() !== "y") throw new Error("用户取消。");
  for (const agent of selectedAgents) {
    const result = await configureAgent(agent, selection, sourceRoot);
    console.log(`${agent.label}: ${result.installed.length} 个 skill -> ${result.target}`);
  }
  console.log("\n配置完成。请重启各 agent 以刷新 skill 列表。\n");
} catch (error) {
  console.error(`\n配置失败: ${error.message}`);
  process.exitCode = 1;
} finally {
  rl.close();
}
