import * as assert from 'assert';
import * as vscode from 'vscode';
import { activate, deactivate } from '../src/extension';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('nemui.project-nemui'));
  });

  test('Should activate extension', async () => {
    const ext = vscode.extensions.getExtension('nemui.project-nemui');
    if (ext) {
      await ext.activate();
      assert.ok(ext.isActive);
    }
  });
});
