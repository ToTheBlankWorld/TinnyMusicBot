// shiva_deobfuscated.js
// Deobfuscated "Ultimate Music Bot" module
// WARNING: this module performs filesystem checks and contains a runtime "core validation" routine.
// Running it in an environment that does not have the expected files may cause it to log errors
// (and you may choose to exit the process in that case).

const fs = require('fs');
const path = require('path');

const SECURITY_TOKEN = "ARES_VALIDATED_COMMAND_2025";

function getInfo() {
  const info = {
    name: "Ares Music Bot",
    version: "1.2.0",
    status: "Unknown",
    description: "Bot information and support system",
    coreValid: false
  };

  try {
    info.coreValid = validateCore();
    info.status = info.coreValid ? "Active" : "Core Missing / Invalid";
  } catch (e) {
    info.status = "Validation error";
    info.error = e.message || String(e);
  }

  return info;
}

/**
 * validateCommandSecurity(cmd, meta)
 * - cmd: an object representing a command (expected to contain securityToken)
 * - meta: optional metadata (expected to contain shivaValidated boolean)
 *
 * Returns true only when both the security token and metadata validation flags are present and correct.
 */
function validateCommandSecurity(cmd = {}, meta = {}) {
  try {
    if (!cmd || typeof cmd !== 'object') return false;
    if (cmd.securityToken !== SECURITY_TOKEN) {
      console.error("[shiva] validateCommandSecurity: invalid security token");
      return false;
    }

    // additional meta checks
    if (!meta || meta.shivaValidated !== true) {
      console.error("[shiva] validateCommandSecurity: meta.shivaValidated missing or false");
      return false;
    }

    return true;
  } catch (e) {
    console.error("[shiva] validateCommandSecurity error:", e);
    return false;
  }
}

/**
 * validateCore()
 * - Looks for ./events/messageCreate (relative to calling module)
 * - Ensures that file contains certain required imports/usages (simple string checks)
 * - Returns boolean
 *
 * Note: This uses simple substring checks to assert the "core" integration is present.
 */
function validateCore() {
  try {
    // Resolve an expected path for events/messageCreate (try .js or .ts)
    const possibleFiles = [
      path.resolve(process.cwd(), './events/messageCreate.js'),
      path.resolve(process.cwd(), './events/messageCreate.ts'),
      path.resolve(__dirname, './events/messageCreate.js'), // fallback
      path.resolve(__dirname, '../events/messageCreate.js')
    ];

    let found = false;
    let content = '';

    for (const p of possibleFiles) {
      if (!p) continue;
      try {
        if (fs.existsSync(p)) {
          content = fs.readFileSync(p, 'utf8');
          found = true;
          break;
        }
      } catch (e) {
        // ignore read errors, continue
      }
    }

    if (!found) {
      console.error("[shiva] validateCore: events/messageCreate file not found in expected locations.");
      return false;
    }

    // required substrings to consider the core valid
    const mustHave = [
      "require('../shiva')",
      "shiva.validateCommandSecurity",
      "module.exports",
      "messageCreate" // ensure it is a messageCreate handler
    ];

    for (const substr of mustHave) {
      if (!content.includes(substr)) {
        console.error(`[shiva] validateCore: missing required token in messageCreate file -> ${substr}`);
        return false;
      }
    }

    // basic signature check - ensure the file mentions expected handler name
    if (!/module\.exports\s*=\s*|exports\./.test(content)) {
      console.error("[shiva] validateCore: messageCreate file appears not to export a handler.");
      return false;
    }

    return true;
  } catch (e) {
    console.error("[shiva] validateCore exception:", e);
    return false;
  }
}

/**
 * initialize(client)
 * - client: a Discord.js-like client which emits 'messageCreate' events
 * - Attaches the handler that looks for the literal command 'srgt'
 */
function initialize(client) {
  if (!client || typeof client.on !== 'function') {
    console.error("[shiva] initialize: invalid client provided.");
    return false;
  }

  // Print a small banner
  console.clear && console.clear();
  console.log("=======================================");
  console.log("  Ultimate Music Bot — Module Loader");
  console.log("  version:", module.exports && module.exports.version ? module.exports.version : "1.0.0");
  console.log("=======================================");

  const coreOk = validateCore();
  if (!coreOk) {
    console.error("[shiva] initialize: core validation failed. Module may not function as expected.");
    // Do not forcibly exit here by default; caller can decide.
    // If you want the original behavior (exit on invalid core), uncomment:
    // process.exit(1);
    return false;
  }

  // Attach the messageCreate handler
  client.on('messageCreate', async (message) => {
    try {
      if (!message) return;
      if (message.author && message.author.bot) return;

      // exact literal trigger
      const trigger = "srgt";
      // Some bots check both content and trimmed lowercase; keeping exact literal behaviour:
      if (typeof message.content === 'string' && message.content === trigger) {
        // try to delete the user's message first
        try {
          if (typeof message.delete === 'function') {
            await message.delete().catch(() => { /* ignore failure */ });
          }
        } catch (err) {
          // ignore delete errors
        }

        // send the two links (one immediately, one after 1s)
        try {
          if (message.channel && typeof message.channel.send === 'function') {
            await message.channel.send('...');
            setTimeout(() => {
              try {
                message.channel.send('https://discord.gg/u9TN448z');
              } catch (e) {
                // ignore
              }
            }, 1000);
          } else {
            console.warn("[shiva] messageCreate: message.channel.send not available.");
          }
        } catch (e) {
          console.error("[shiva] messageCreate handler error:", e);
        }
      }
    } catch (e) {
      console.error("[shiva] messageCreate top-level error:", e);
    }
  });

  return true;
}

module.exports = {
  initialize,
  getInfo,
  version: "1.0.0",
  validateCore,
  validateCommandSecurity,
  SECURITY_TOKEN
};
