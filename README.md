# Avalanche CLI Command Tree 🔺

This project generates a JSON representation of the Avalanche CLI command tree and provides a web interface to explore it. The process works in two parts:

1. **Tree Generation**: Generates a comprehensive JSON structure of all Avalanche CLI commands
2. **Web Interface**: A React application that visualizes and makes the command tree searchable

## Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.
- [Bun](https://bun.sh/) as your package manager.
- [Avalanche CLI](https://github.com/ava-labs/avalanche-cli) installed and accessible from your command line.

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/chrisfusillo/avalanche-cli-tree.git
   cd avalanche-cli-tree
   ```

2. **Install dependencies using Bun:**

   ```bash
   bun install
   ```

## How It Works

### 1. Install Avalanche CLI

To generate the command tree, you need the Avalanche CLI installed on your system. Follow these steps to install it:

```
curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanche-cli/main/scripts/install.sh | sh -s
```

### 2. Generate the Command Tree

Generate the command tree JSON file:

```bash
bun run generateTree.js
```

This script:

- Executes `avalanche --help` recursively to map all commands
- Parses command descriptions, flags, and subcommands
- Creates `public/avalanche_command_tree.json`

### 3. Run the Web Interface

After generating the tree, start the development server:

```bash
bun run start
```

The web interface:

- Loads the generated JSON file
- Provides an interactive tree view of all commands
- Enables searching and copying command paths
- Shows detailed descriptions and flags for each command

## Usage

After generating the command tree, you can use the `avalanche_command_tree.json` file in your application. For example, you might:

- Build a documentation site that lists all available Avalanche CLI commands.
- Implement auto-completion features in your command-line applications.
- Create interactive tutorials or tools that utilize the command tree.

## Scripts

- **Start the development server:**

  ```bash
  bun run start
  ```

- **Build the project:**

  ```bash
  bun run build
  ```

## Dependencies

The project uses the following main dependencies:

- **React**: Front-end library for building user interfaces.
- **React Icons**: Collection of popular icon packs.
- **Avalanche CLI**: Command-line interface for Avalanche.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.

## Author

**Chris Fusillo** ([@chrisfusillo](https://x.com/chrisfusillo))

## Support This Project

If you find this project helpful, consider supporting its development:

```
AVAX: 0x01b42a0F481D0119039899E938c1fb89e94d58E3
```
