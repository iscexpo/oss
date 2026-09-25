import * as assert from "assert";
import * as vscode from "vscode";
import { VENDOR } from "../../extension";

suite("Language Model Chat Provider", () => {
  test("extension activates successfully", async () => {
    const extension = vscode.extensions.getExtension(
      "vibe-coding.language-model-chat-provider"
    );
    assert.ok(extension, "extension should be installed in the development host");
    await extension?.activate();
    assert.ok(true);
  });

  test("registers at least one model with the language model API", async () => {
    const models = await vscode.lm.selectChatModels({ vendor: VENDOR });
    assert.ok(models.length >= 1, "expected at least one 'vibe' model");
    assert.strictEqual(models[0].vendor, VENDOR);
    assert.ok(models[0].name.length > 0);
  });

  test("exposes the expected default settings", () => {
    const config = vscode.workspace.getConfiguration("languageModelChatProvider");
    assert.strictEqual(config.get("baseUrl"), "https://api.kilo.ai/api/gateway");
    assert.strictEqual(config.get("model"), "kilo-auto/free");
    assert.ok((config.get("maxOutputTokens") as number) > 0);
  });
});