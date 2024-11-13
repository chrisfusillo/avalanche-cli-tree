import React, { useEffect, useState, useCallback } from "react";

function renderTree(data) {
  let output = "🔺 avalanche";
  output += ` <span class="clipboard" data-copy="avalanche">📋</span>`;
  if (data.description) {
    output += ` <span class="tooltip" data-tooltip="${data.description}">ⓘ</span>`;
  }
  output += "\n";

  if (data.flags) {
    output += renderFlags(data.flags, 0, "avalanche");
  }

  if (data.subcommands) {
    output += renderSubcommands(data.subcommands, 0, "avalanche");
  }

  return output;
}

function renderFlags(flags, depth, parentPath) {
  let output = "";
  const sortedFlags = Object.entries(flags).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const maxFlagLength = Math.max(
    ...sortedFlags.map(
      ([flag, details]) =>
        flag.length + (details.type ? details.type.length + 3 : 0)
    )
  );

  for (const [flag, details] of sortedFlags) {
    let line = `${"│ ".repeat(
      depth + 1
    )}├─ <span class="clipboard" data-copy="${parentPath} ${flag}">📋</span> ${flag}`;
    if (details.type) {
      line += ` (${details.type})`;
    }
    const paddingLength =
      maxFlagLength -
      (flag.length + (details.type ? details.type.length + 3 : 0));
    line += " ".repeat(paddingLength + 2);

    let description = details.description || "";
    if (details.alias) {
      description = `${details.alias}, ${description}`;
    }

    output += `${line}${description}\n`;
  }

  return output;
}

function renderSubcommands(subcommands, depth, parentPath) {
  let output = "";
  const sortedSubcommands = Object.entries(subcommands).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  for (const [command, details] of sortedSubcommands) {
    const fullPath = `${parentPath} ${command}`;
    output += renderCommand(command, details, depth, fullPath);
  }

  return output;
}

function renderCommand(command, details, depth, fullPath) {
  let output = `${"│ ".repeat(depth)}├─ 🔺 ${fullPath}`;
  output += ` <span class="clipboard" data-copy="${fullPath}">📋</span>`;
  if (details.description) {
    output += ` <span class="tooltip" data-tooltip="${details.description}">ⓘ</span>`;
  }
  output += "\n";

  if (details.flags) {
    output += renderFlags(details.flags, depth + 1, fullPath);
  }

  if (details.subcommands) {
    output += renderSubcommands(details.subcommands, depth + 1, fullPath);
  }

  return output;
}

function renderMobileList(data) {
  let output = '<ul class="mobile-list">';

  function addCommandToList(command, path) {
    output += `<li><span class="clipboard" data-copy="${path}">${path}</span></li>`;

    if (command.flags) {
      for (const [flag, details] of Object.entries(command.flags)) {
        output += `<li><span class="clipboard" data-copy="${path} ${flag}">${path} ${flag}</span></li>`;
      }
    }

    if (command.subcommands) {
      for (const [subcommand, subDetails] of Object.entries(
        command.subcommands
      )) {
        addCommandToList(subDetails, `${path} ${subcommand}`);
      }
    }
  }

  addCommandToList(data, "avalanche");

  output += "</ul>";
  return output;
}

function App() {
  const [commandTree, setCommandTree] = useState(null);
  const [cliVersion, setCliVersion] = useState("");
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    fetch(`/avalanche_command_tree.json?t=${Date.now()}`, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        setCommandTree(data.tree);
        setCliVersion(data.version);
      })
      .catch((error) => {
        console.error("Error loading command tree:", error);
        setError(error.message);
      });
  }, []);

  const handleCopy = useCallback((event) => {
    const target = event.target;
    if (target.classList.contains("clipboard")) {
      const textToCopy = target.getAttribute("data-copy");
      const originalText = target.textContent;

      const copyToClipboard = (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(text);
        } else {
          const textArea = document.createElement("textarea");
          textArea.value = text;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          return Promise.resolve();
        }
      };

      copyToClipboard(textToCopy)
        .then(() => {
          target.textContent = "✅";
          setTimeout(() => {
            target.textContent = originalText;
          }, 1000);
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
          target.textContent = "❌";
          setTimeout(() => {
            target.textContent = originalText;
          }, 1000);
        });
    }
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleCopy);
    return () => {
      document.removeEventListener("click", handleCopy);
    };
  }, [handleCopy]);

  const filteredTree = useCallback(
    (tree) => {
      if (!searchTerm) return tree;

      const searchRegex = new RegExp(searchTerm, "i");

      const filterObject = (obj, path = "") => {
        const newObj = {};
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path} ${key}` : key;
          if (typeof value === "object" && value !== null) {
            const filteredValue = filterObject(value, currentPath);
            if (
              Object.keys(filteredValue).length > 0 ||
              searchRegex.test(currentPath)
            ) {
              newObj[key] = { ...filteredValue };
              if (value.flags) {
                newObj[key].flags = value.flags;
              }
              if (value.description) {
                newObj[key].description = value.description;
              }
            }
          } else if (searchRegex.test(currentPath) || searchRegex.test(value)) {
            newObj[key] = value;
          }
        }
        return newObj;
      };

      return filterObject(tree);
    },
    [searchTerm]
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="App">
      <header className="header">
        <h1>Avalanche CLI Command Tree {cliVersion}</h1>
        <p>
          By Chris Fusillo at{" "}
          <a
            href="https://metapep.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            metapep labs
          </a>
        </p>
        <a
          href="https://github.com/ava-labs/avalanche-cli/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Install Avalanche CLI {cliVersion}
        </a>
      </header>
      <p className="instructions">
        {isMobile
          ? "Search and copy CLI commands."
          : "Search CLI commands and flags. Click 📋 to copy the entire command string."}
      </p>
      <input
        type="text"
        placeholder="Search commands..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      {error && <div className="error">Error: {error}</div>}
      {commandTree ? (
        <div className="command-container">
          {isMobile ? (
            <div
              className="mobile-tree"
              dangerouslySetInnerHTML={{
                __html: renderMobileList(filteredTree(commandTree)),
              }}
            />
          ) : (
            <pre
              className="command-tree"
              dangerouslySetInnerHTML={{
                __html: renderTree(filteredTree(commandTree)),
              }}
            />
          )}
        </div>
      ) : (
        <div className="loading">Loading...</div>
      )}
      <footer className="footer">
        <a
          href={`https://github.com/ava-labs/avalanche-cli/releases/tag/${cliVersion}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Install Avalanche CLI {cliVersion}
        </a>
        <p>
          Interested in starting an{" "}
          <a
            href="https://docs.avax.network"
            target="_blank"
            rel="noopener noreferrer"
          >
            Avalanche L1
          </a>
          ?
        </p>
      </footer>
    </div>
  );
}

export default App;
