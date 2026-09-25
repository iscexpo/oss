import * as fs from "fs";
import * as path from "path";
import Mocha from "mocha";

function collectTestFiles(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectTestFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith(".test.js")) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function run(): Promise<void> {
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
    timeout: 30000,
  });

  const testsRoot = __dirname;
  for (const file of collectTestFiles(testsRoot)) {
    mocha.addFile(file);
  }

  try {
    await new Promise<void>((resolve, reject) => {
      mocha.run((failures) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}