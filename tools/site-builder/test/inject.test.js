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
    const config = { siteUrl: 'https://example.com' };
    
    const result = injectRichHtml(html, page, pages, config);
    
    assert.ok(result.includes('site-slim-nav'));
    assert.ok(result.includes('href="/"'));
    assert.ok(result.includes('href="/other/"'));
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
