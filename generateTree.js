const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Utility to run CLI commands and return the output as a promise
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error.message);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

async function getCliVersion() {
  try {
    const versionOutput = await runCommand("avalanche --version");
    const versionMatch = versionOutput.match(/\d+\.\d+\.\d+/);
    return versionMatch ? `v${versionMatch[0]}` : "Unknown";
  } catch (error) {
    console.warn(`Error fetching CLI version: ${error}`);
    return "Unknown";
  }
}

function parseFlags(flagLines) {
  const flags = {};
  let currentFlag = null;
  let currentType = "";
  let currentDescription = [];

  for (const line of flagLines) {
    const flagMatch = line.match(
      /^\s*(-[\w-]+,?\s*)?(--[\w-]+)(\s+[\w<>]+)?(\s+.*)?$/
    );
    if (flagMatch) {
      if (currentFlag) {
        flags[currentFlag] = {
          type: currentType,
          description: currentDescription.join(" ").trim(),
        };
        currentType = "";
        currentDescription = [];
      }
      const shortFlag = flagMatch[1]
        ? flagMatch[1].trim().replace(",", "")
        : null;
      currentFlag = flagMatch[2];
      currentType = flagMatch[3] ? flagMatch[3].trim() : "";
      currentDescription = flagMatch[4] ? [flagMatch[4].trim()] : [];

      if (shortFlag) {
        flags[shortFlag] = { alias: currentFlag };
      }
    } else if (currentFlag && line.trim()) {
      currentDescription.push(line.trim());
    }
  }

  if (currentFlag) {
    flags[currentFlag] = {
      type: currentType,
      description: currentDescription.join(" ").trim(),
    };
  }

  return flags;
}

// Recursive function to fetch and parse CLI commands
async function fetchCommandDetails(command) {
  try {
    const output = await runCommand(`${command} -h`);
    const lines = output.split("\n").map((line) => line.trim());

    const details = {
      description: "",
      flags: {},
      subcommands: {},
    };

    let inAvailableCommandsSection = false;
    let inFlagsSection = false;
    let currentFlags = [];
    let descriptionLines = [];

    for (const line of lines) {
      if (line === "Available Commands:") {
        inAvailableCommandsSection = true;
        inFlagsSection = false;
        continue;
      }
      if (line === "Flags:") {
        inFlagsSection = true;
        inAvailableCommandsSection = false;
        continue;
      }

      if (!inAvailableCommandsSection && !inFlagsSection) {
        if (line.length > 0) {
          descriptionLines.push(line);
        }
      }

      if (inAvailableCommandsSection && line.length > 0) {
        const parts = line.split(/\s+(.+)/);
        if (parts.length >= 2) {
          const subcommandName = parts[0];
          const subcommandDescription = parts[1];
          details.subcommands[subcommandName] = {
            description: subcommandDescription,
          };
        }
      }

      if (inFlagsSection) {
        currentFlags.push(line);
      }
    }

    details.description = descriptionLines.join(" ").trim();
    details.flags = parseFlags(currentFlags);
    return details;
  } catch (error) {
    console.warn(`Error fetching details for "${command}": ${error}`);
    return { description: "", flags: {}, subcommands: {} };
  }
}

async function buildCommandTree(command = "avalanche") {
  console.log(`Processing command: ${command}`);
  const details = await fetchCommandDetails(command);
  const node = {
    description: details.description,
    flags: details.flags,
    subcommands: {},
  };

  for (const [subcommand, subcommandDetails] of Object.entries(
    details.subcommands
  )) {
    const fullCommand = `${command} ${subcommand}`;
    node.subcommands[subcommand] = await buildCommandTree(fullCommand);
    if (!node.subcommands[subcommand].description) {
      node.subcommands[subcommand].description = subcommandDetails.description;
    }
  }

  return node;
}

// Entry point: start with avalanche and recursively build the command tree
(async () => {
  try {
    const cliVersion = await getCliVersion();
    const cliTree = await buildCommandTree();
    const outputData = {
      version: cliVersion,
      tree: cliTree,
    };
    const outputPath = path.join(
      __dirname,
      "public",
      "avalanche_command_tree.json"
    );
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), "utf-8");
    console.log(
      `Command tree for Avalanche CLI ${cliVersion} saved to public/avalanche_command_tree.json`
    );
  } catch (error) {
    console.error(`Failed to build the CLI command tree: ${error}`);
  }
})();
