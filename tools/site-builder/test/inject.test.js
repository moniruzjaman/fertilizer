import { describe, it } from 'node:test';
import assert from 'node:assert';
import { injectRichHtml, innerHtml } from '../src/inject.js';
import { fragmentPageHtml } from '../src/templates.js';

describe('inject', () => {
  it('returns innerHtml when no body', () => {
    assert.strictEqual(innerHtml('<h1>Test</h1>'), '<h1>Test</h1>');
  });

  it('extracts body content', () => {
    const html = '<html><body><h1>Test</h1></body></html>';
    assert.strictEqual(innerHtml(html), '<h1>Test</h1>');
  });

  it('injects SEO tags into rich HTML', () => {
    const html = '<html><head><title>Old</title></head><body><p>Content</p></body></html>';
    const page = { slug: 'test', title: 'Test Page', description: 'Test desc' };
    const config = { siteUrl: 'https://example.com' };
    
    const result = injectRichHtml(html, page, [], config);
    
    assert.ok(result.includes('<title>Test Page</title>'));
    assert.ok(result.includes('content="Test desc"'));
    assert.ok(result.includes('og:title'));
  });

  it('adds navigation to rich HTML', () => {
    const html = '<html><head></head><body><p>Content</p></body></html>';
    const page = { slug: 'test', title: 'Test' };
    const pages = [page, { slug: 'other', title: 'Other' }];
    // Drawer links must carry the deployment base prefix; root-absolute "/"
    // paths would escape /fertilizer/ on GitHub Pages and 404.
    const config = { siteUrl: 'https://example.com', siteBase: 'https://example.com/fertilizer' };

    const result = injectRichHtml(html, page, pages, config);

    assert.ok(result.includes('slimnav-root'));
    assert.ok(result.includes('href="https://example.com/fertilizer/"'));
    assert.ok(result.includes('href="https://example.com/fertilizer/other/"'));
    // No stale inline nav strip class remains on injected chrome.
    assert.ok(!result.includes('class="site-slim-nav"'));
  });
});

describe('fragment wrap', () => {
  it('wraps fragment HTML without navigation', () => {
    const html = '<h1>Hi</h1><p>There</p>';
    const page = { slug: 'note', title: 'Note', description: 'Desc' };
    const pages = [page, { slug: 'dash', title: 'Dash' }];
    const config = { siteUrl: 'https://moniruzjaman.github.io/fertilizer' };
    
    const result = fragmentPageHtml(page, pages, config, html);
    
    // Should contain the content
    assert.ok(result.includes('<h1>Hi</h1>'));
    assert.ok(result.includes('<p>There</p>'));
    
    // Should have proper HTML structure
    assert.ok(result.includes('<!DOCTYPE html>'));
    assert.ok(result.includes('<html'));
    assert.ok(result.includes('</html>'));
    
    // Should include SEO tags
    assert.ok(result.includes('<title>Note</title>'));
    assert.ok(result.includes('content="Desc"'));
    
    // Navigation is the drawer-only chrome (no cluttering inline strip):
    // fragments get the same "☰ drawer & pages" slide-in as every other page,
    // and must never contain a stale `site-slim-nav` inline nav element.
    assert.ok(!result.includes('class="site-slim-nav"'), 'Fragments must not include an inline nav strip');
    assert.ok(result.includes('slimnav-root'), 'Fragments include the drawer navigation');
    assert.ok(result.includes('href="https://moniruzjaman.github.io/fertilizer/dash/"'), 'Drawer links carry the deployment base (no 404s)');
    // PDF/DOCX/Print tools are exposed in the top-most header bar on every page.
    assert.ok(result.includes('sn-topbar-tools'));
    assert.ok(result.includes('data-pt-action="pdf"'));
    assert.ok(result.includes('data-pt-action="docx"'));
    assert.ok(result.includes('data-pt-action="print"'));
    // No redundant footer toolbelt duplicates the header icons.
    assert.ok(!result.includes('id="page-tools"'));
  });
});
