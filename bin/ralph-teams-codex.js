#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const repoRoot = path.resolve(__dirname, "..");
const sourceSkillsDir = path.join(repoRoot, "skills");
const skillDirectoryByName = {
  "teams-plan": "teams-plan",
  "teams-run": "teams-run",
  "teams-verify": "teams-verify",
  "teams-debug": "debug",
  "teams-document": "teams-document"
};
const defaultSkillNames = [
  "teams-plan",
  "teams-run",
  "teams-verify",
  "teams-debug",
  "teams-document"
];

function printHelp() {
  console.log(`ralph-teams-codex

Install or uninstall Codex skills from this package.

Usage:
  ralph-teams-codex --global
  ralph-teams-codex --local
  ralph-teams-codex --global --skills teams-plan,teams-run
  ralph-teams-codex --global --uninstall

Options:
  --global        Install into ~/.codex/skills or $CODEX_HOME/skills
  --local         Install into ./.codex/skills
  --skills <csv>  Comma-separated list of skill names to install
  --uninstall     Remove installed skills instead of copying them
  --help          Show this help
`);
}

function parseArgs(argv) {
  const options = {
    scope: null,
    uninstall: false,
    skills: [...defaultSkillNames]
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--global") {
      options.scope = "global";
    } else if (arg === "--local") {
      options.scope = "local";
    } else if (arg === "--uninstall") {
      options.uninstall = true;
    } else if (arg === "--skills") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("--skills requires a comma-separated value");
      }
      options.skills = value.split(",").map((item) => item.trim()).filter(Boolean);
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.help && !options.scope) {
    throw new Error("Choose exactly one install scope: --global or --local");
  }

  return options;
}

function resolveTargetSkillsDir(scope) {
  if (scope === "local") {
    return path.resolve(process.cwd(), ".codex", "skills");
  }

  const codexHome = process.env.CODEX_HOME
    ? path.resolve(process.env.CODEX_HOME)
    : path.join(os.homedir(), ".codex");
  return path.join(codexHome, "skills");
}

function ensureKnownSkills(skills) {
  const unknown = skills.filter((skill) => !Object.hasOwn(skillDirectoryByName, skill));
  if (unknown.length > 0) {
    throw new Error(`Unknown skills: ${unknown.join(", ")}`);
  }
}

function copyDirectory(sourceDir, targetDir) {
  fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });
}

function removeDirectory(targetDir) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}

function installSkills(targetSkillsDir, skills) {
  fs.mkdirSync(targetSkillsDir, { recursive: true });
  for (const skill of skills) {
    const sourceDir = path.join(sourceSkillsDir, skillDirectoryByName[skill]);
    const targetDir = path.join(targetSkillsDir, skill);
    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Missing source skill directory: ${sourceDir}`);
    }
    copyDirectory(sourceDir, targetDir);
    console.log(`Installed ${skill} -> ${targetDir}`);
  }
}

function uninstallSkills(targetSkillsDir, skills) {
  for (const skill of skills) {
    const targetDir = path.join(targetSkillsDir, skill);
    removeDirectory(targetDir);
    console.log(`Removed ${targetDir}`);
  }
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return;
    }

    ensureKnownSkills(options.skills);
    const targetSkillsDir = resolveTargetSkillsDir(options.scope);

    if (options.uninstall) {
      uninstallSkills(targetSkillsDir, options.skills);
      console.log("Done. Restart Codex to refresh installed skills.");
      return;
    }

    installSkills(targetSkillsDir, options.skills);
    console.log("Done. Restart Codex to load the new skills.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
