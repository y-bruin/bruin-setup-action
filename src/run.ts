import cp from "child_process";
import * as os from "os";
import * as path from "path";
import * as core from "@actions/core";
import * as io from "@actions/io";
import { getBruin } from "./bruin";
import { Error, isError } from "./error";

export async function run(): Promise<void> {
  try {
    const result = await runSetup();
    if (result !== null && isError(result)) {
      core.setFailed(result.message);
    }
  } catch (error) {
    // In case we ever fail to catch an error
    // in the call chain, we catch the error
    // and mark the build as a failure. The
    // user is otherwise prone to false positives.
    if (isError(error)) {
      core.setFailed(error.message);
      return;
    }
    core.setFailed("Internal error");
  }
}

// runSetup runs the bruin-setup action, and returns
// a non-empty error if it fails.
async function runSetup(): Promise<null | Error> {
  const version = core.getInput("version");
  if (version === "") {
    return {
      message: "a version was not provided",
    };
  }

  const installOnly  = core.getInput("install_only");
  if (installOnly) {
    core.info("It's a install Only action")
  }

  core.info(`Setting up bruin version "${version}"`);
  const installDir = await getBruin(version, installOnly);
  if (isError(installDir)) {
    return installDir;
  }

  core.info("Adding bruin binary to PATH");
  let binaryPath = "";
  if (os.platform() === "win32") {
    core.addPath(installDir);
  } else {
    core.addPath(path.join(installDir, "bin"));
  }
  binaryPath = await io.which("bruin", true);
  if (binaryPath === "") {
    return {
      message: "bruin was not found on PATH",
    };
  }

  core.info(`Successfully setup bruin version ${version}`);
  core.info(cp.execSync(`${binaryPath} --version`).toString());

  if (installOnly != "true") {
    
  }
  return null;
}
