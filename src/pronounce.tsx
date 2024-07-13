import { LaunchProps, Toast, getSelectedText, showHUD, showToast } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { execSync } from "child_process";
import { getLastCommand, setLastCommand } from "./last-command";
import { playTTS } from "./play-tts";

export default async function Command(props: LaunchProps<{ arguments: { text: string } }>) {
  let text = props.arguments.text.trim();

  if (!text.length) {
    try {
      text = (await getSelectedText()).trim();

      if (!text.length) {
        throw null;
      }
    } catch {
      return showHUD("No text selected");
    }
  }

  const lastCommand = getLastCommand();
  const shouldPronounceSlow = lastCommand?.text === text;

  try {
    if (lastCommand?.processId) {
      try {
        // TODO: CAN THIS ACCIDENTALLY KILL ANOTHER RANDOM PROCESS IF THE PID IS REUSED?
        execSync(`kill ${lastCommand.processId}`);
        // we don't need to do anything if the process is already killed
        // eslint-disable-next-line no-empty
      } catch {}
    }

    const process = await playTTS(text, { lang: "en", slow: shouldPronounceSlow });
    setLastCommand({
      text,
      processId: process.pid?.toString() ?? "",
    });

    await showToast({
      title: "Pronouncing...",
      style: Toast.Style.Success,
      primaryAction: {
        title: "Stop playing",
        onAction: () => {
          if (process && !process.killed) {
            process.kill();
          }
        },
        shortcut: { key: "p", modifiers: ["cmd"] },
      },
    });
  } catch (error) {
    if (error instanceof RangeError) {
      return showToast({
        title: `Text (${text.length}) should be less than 200 characters`,
        style: Toast.Style.Failure,
      });
    }

    showFailureToast(error);
  }
}
