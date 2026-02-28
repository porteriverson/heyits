import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function sendSMS(to: string, body: string): Promise<void> {
  const safeBody = body.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const script = `
    tell application "Messages"
      set targetService to 1st service whose service type = iMessage
      set targetBuddy to buddy "${to}" of targetService
      send "${safeBody}" to targetBuddy
    end tell
  `;
  await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
}
