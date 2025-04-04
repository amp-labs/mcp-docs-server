<br/>
<div align="center">
    <a href="https://www.withampersand.com/?utm_source=github&utm_medium=readme&utm_campaign=mcp-docs-server&utm_content=logo">
    <img src="https://res.cloudinary.com/dycvts6vp/image/upload/v1723671980/ampersand-logo-black.svg" height="30" align="center" alt="Ampersand logo" >
    </a>
<br/>
<br/>

<div align="center">

[![Star us on GitHub](https://img.shields.io/github/stars/amp-labs/connectors?color=FFD700&label=Stars&logo=Github)](https://github.com/amp-labs/connectors) [![Discord](https://img.shields.io/badge/Join%20The%20Community-black?logo=discord)](https://discord.gg/BWP4BpKHvf) [![Documentation](https://img.shields.io/badge/Read%20our%20Documentation-black?logo=book)](https://docs.withampersand.com) ![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg) <img src="https://img.shields.io/static/v1?label=license&message=MIT&color=white" alt="License">
</div>

</div>

# Ampersand MCP docs server 

## Use `npx` to automatically run the server 

This will start the server at http://localhost:3001

`npx @amp-labs/mcp-docs-server@latest`



## Connecting to the mcp server from an MCP Client

Add the following in your `mcp.json` in cursor IDE or `claude_desktop_config.json` when using Claude desktop.

> [Optional] To run the openapi tools you'd need to pass in the Ampersand API key as an argument 

> Note: This server runs in HTTP SSE mode 

```
{
  "mcpServers": {
    "@amp-labs/mcp-docs-server": {
      "url": "http://localhost:3001/sse",
      "env": {
        "AMPERSAND_API_KEY": "<AMP_KEY>" // optional
      }
    }
  }
}

```

# Building locally 

### Install dependencies

`pnpm i`

### Build the MCP SSE server

`pnpm build`


### Start the server

`pnpm start`


## Debugging & troubleshooting
 
Use the MCP inspector tool to know more about the mcp server and debug tools, prompts, resources 

`pnpm inspect`