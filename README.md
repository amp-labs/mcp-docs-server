# Running the mcp server locally 


Add the following in your `mcp.json` in cursor IDE or `claude_desktop_config.json` when using Claude desktop.
To run the openapi tools you'd need to pass in the Ampersand API key, in this case add the api key as an argument 

> Note: This server runs in HTTP SSE mode 

```
{
  "mcpServers": {
    "@amp-labs/mcp-docs-server": {
      "url": "http://localhost:3001/sse",
      "env": {
        "AMPERSAND_API_KEY": "<AMP_KEY>"
      }
    }
  }
}

```