# Running the mcp server locally 

Add the following in your `mcp.json` in cursor IDE or `claude_desktop_config.json` when using Claude desktop

```
{
  "mcpServers": {
    "@amp-labs/mcp-docs-server": {
      "command": "node",
      "args": [
        "<PATH_TO_REPO>/mcp-docs-server/src/index.js"
      ]
    }
  }
}

```

To run the openapi tools you'd need to pass in the Ampersand API key. In this case add the api key as an argument 

```

{
  "mcpServers": {
    "@amp-labs/mcp-docs-server": {
      "command": "node",
      "args": [
        "/Users/jatin/Desktop/mcp-docs-server/src/index.js"
      ],
      "env": {
        "AMPERSAND_API_KEY": "<YOUR_API_KEY>"
      }
    }
  }
}

```