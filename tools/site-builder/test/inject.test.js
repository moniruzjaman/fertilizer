import { describe, it } from 'node:test';
import assert from 'node:assert';
import { injectRichHtml, innerHtml } from '../src/inject.js';
import { catalogHtml, fragmentPageHtml, notFoundHtml, pdfReaderHtml, slimNav } from '../src/templates.js';

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
    const config = { siteUrl: 'https://example.com' };
    
    const result = injectRichHtml(html, page, pages, config);
    
    assert.ok(result.includes('site-slim-nav'));
    assert.ok(result.includes('href="https://example.com/"'));
    assert.ok(result.includes('href="https://example.com/other/"'));
    // Drawer + toolbelt are injected exactly once per page (no stacking).
    assert.equal(result.split('id="slimnav-root"').length - 1, 1, 'exactly one drawer');
    assert.equal(result.split('id="page-tools"').length - 1, 1, 'exactly one toolbelt');
    // Tool icons live in the TOP header (not the footer).
    assert.match(result, /#page-tools\{[^}]*position:fixed;top:14px;right:14px/);
  });

  it('renders the same synced drawer on every page type', () => {
    const pages = [{ slug: 'alpha', title: 'Alpha' }, { slug: 'beta', title: 'Beta' }];
    const config = { siteUrl: 'https://moniruzjaman.github.io/fertilizer' };

    const nav = slimNav(pages, config, 'alpha');
    // Links are identical across pages (synced) and honor the site base path.
    assert.ok(nav.includes('href="https://moniruzjaman.github.io/fertilizer/alpha/"'));
    assert.ok(nav.includes('href="https://moniruzjaman.github.io/fertilizer/beta/"'));
    assert.ok(nav.includes('>← Home</a>'), 'home link present');
    assert.ok(nav.includes('aria-current="page"'), 'marks current page');

    const reader = pdfReaderHtml({ slug: 'alpha', title: 'Alpha' }, pages, config);
    const nf = notFoundHtml(pages, config);
    const home = catalogHtml(pages, config);
    for (const [name, html] of [['reader', reader], ['404', nf], ['home', home]]) {
      assert.ok(html.includes('id="sn-open"'), name + ' must carry the drawer button');
      assert.ok(html.includes('id="sn-drawer"'), name + ' must carry the drawer');
      assert.ok(html.includes('id="page-tools"'), name + ' must carry the tool icons');
      assert.ok(html.includes('/fertilizer/beta/'), name + ' drawer must list the same pages');
    }
    // Home hides its legacy bottom FAB so chrome matches other pages.
    assert.match(home, /\.mobile-fab \{ display: none !important; \}/);
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
    
    // Should NOT include navigation (fragments are minimal wrappers)
    assert.ok(!result.includes('site-slim-nav'), 'Fragments should not include navigation');
  });
});
